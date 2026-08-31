import time
import json
import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.detection.correlation import incident_engine
from app.services.queue import queue_manager

client = TestClient(app)

class TestE2ETenantIsolationAndMap(unittest.TestCase):
    def setUp(self):
        incident_engine.clear()

    def test_e2e_user_a_user_b_complete_isolation_and_map(self):
        ts_suffix = str(int(time.time()))
        user_a = f"user_a_e2e_{ts_suffix}"
        user_b = f"user_b_e2e_{ts_suffix}"
        pwd = "Password123!"

        # ----------------------------------------------------
        # 1. User A Register & Login
        # ----------------------------------------------------
        reg_a = client.post("/api/v1/auth/register", json={"username": user_a, "password": pwd})
        self.assertEqual(reg_a.status_code, 201)

        login_a = client.post("/api/v1/auth/login", json={"username": user_a, "password": pwd})
        self.assertEqual(login_a.status_code, 200)
        token_a = login_a.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # User A initially has 0 events, 0 incidents, 0 reports
        res_events_a0 = client.get("/api/v1/dashboard/events/recent", headers=headers_a)
        self.assertEqual(res_events_a0.json()["count"], 0)

        res_inc_a0 = client.get("/api/v1/dashboard/incidents", headers=headers_a)
        self.assertEqual(res_inc_a0.json()["count"], 0)

        res_rep_a0 = client.get("/api/v1/dashboard/reports", headers=headers_a)
        self.assertEqual(res_rep_a0.json()["count"], 0)

        # ----------------------------------------------------
        # 2. User A Uploads Unique Log (London IP 185.220.100.22)
        # ----------------------------------------------------
        log_payload_a = "Aug 30 2026 15:00:00: %ASA-4-106023: Deny tcp src outside:185.220.100.22/51422 dst inside:10.0.0.10/22 by access-group outside_acl"
        ingest_a = client.post("/api/v1/ingest/file", files={"file": ("london_asa.log", log_payload_a.encode("utf-8"), "text/plain")}, headers=headers_a)
        self.assertEqual(ingest_a.status_code, 200)

        # User A sees event
        res_events_a1 = client.get("/api/v1/dashboard/events/recent", headers=headers_a)
        events_a = res_events_a1.json()["events"]
        self.assertEqual(len(events_a), 1)
        self.assertEqual(events_a[0]["source_ip"], "185.220.100.22")
        self.assertEqual(events_a[0]["owner_username"], user_a)

        # User A GeoIP lookup for source_ip
        res_geo_a = client.get(f"/api/v1/dashboard/geoip/lookup/{events_a[0]['source_ip']}", headers=headers_a)
        self.assertEqual(res_geo_a.status_code, 200)
        geo_a = res_geo_a.json()
        self.assertEqual(geo_a["city"], "London")
        self.assertFalse(geo_a["is_private"])

        # User A saves a report
        save_rep_a = client.post("/api/v1/dashboard/reports/save", json={"title": "Report A", "summary": "Findings A"}, headers=headers_a)
        self.assertEqual(save_rep_a.status_code, 200)

        # ----------------------------------------------------
        # 3. User B Register & Login
        # ----------------------------------------------------
        reg_b = client.post("/api/v1/auth/register", json={"username": user_b, "password": pwd})
        self.assertEqual(reg_b.status_code, 201)

        login_b = client.post("/api/v1/auth/login", json={"username": user_b, "password": pwd})
        self.assertEqual(login_b.status_code, 200)
        token_b = login_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # User B MUST NOT see User A's data!
        res_events_b0 = client.get("/api/v1/dashboard/events/recent", headers=headers_b)
        self.assertEqual(res_events_b0.json()["count"], 0)

        res_inc_b0 = client.get("/api/v1/dashboard/incidents", headers=headers_b)
        self.assertEqual(res_inc_b0.json()["count"], 0)

        res_rep_b0 = client.get("/api/v1/dashboard/reports", headers=headers_b)
        self.assertEqual(res_rep_b0.json()["count"], 0)

        res_csv_b0 = client.get("/api/v1/dashboard/export/csv", headers=headers_b)
        self.assertEqual(res_csv_b0.status_code, 200)
        csv_b0_text = res_csv_b0.text
        self.assertNotIn("185.220.100.22", csv_b0_text)

        # ----------------------------------------------------
        # 4. User B Uploads Unique Log (Paris IP 51.15.10.20)
        # ----------------------------------------------------
        log_payload_b = "Aug 30 2026 15:05:00: %ASA-4-106023: Deny tcp src outside:51.15.10.20/54321 dst inside:10.0.0.10/80 by access-group outside_acl"
        ingest_b = client.post("/api/v1/ingest/file", files={"file": ("paris_asa.log", log_payload_b.encode("utf-8"), "text/plain")}, headers=headers_b)
        self.assertEqual(ingest_b.status_code, 200)

        # User B sees ONLY User B's event
        res_events_b1 = client.get("/api/v1/dashboard/events/recent", headers=headers_b)
        events_b = res_events_b1.json()["events"]
        self.assertEqual(len(events_b), 1)
        self.assertEqual(events_b[0]["source_ip"], "51.15.10.20")
        self.assertEqual(events_b[0]["owner_username"], user_b)
        self.assertNotIn("185.220.100.22", [e["source_ip"] for e in events_b])

        # User B GeoIP lookup for source_ip
        res_geo_b = client.get(f"/api/v1/dashboard/geoip/lookup/{events_b[0]['source_ip']}", headers=headers_b)
        self.assertEqual(res_geo_b.status_code, 200)
        geo_b = res_geo_b.json()
        self.assertEqual(geo_b["city"], "Paris")

        print("\n[SUCCESS] E2E Tenant Isolation & Dynamic Map Markers Verification Passed Perfectly!")

if __name__ == "__main__":
    unittest.main()
