import pytest
import hashlib
from app.parsers.vendor_parsers import (
    CiscoASAParser,
    FortinetParser,
    SuricataParser,
    PfSenseParser,
)
from app.parsers.dynamic_parser import DynamicParser
from app.audit.hash_chain import audit_merkle_tree, MerkleTree
from app.normalization.schema import UnifiedEvent

def test_cisco_asa_parser():
    parser = CiscoASAParser()
    sample_log = (
        "%ASA-4-106023: Deny tcp src outside:192.168.1.100/54321 "
        'dst inside:10.0.0.50/80 by access-group "outside_acl"'
    )

    assert parser.matches(sample_log) is True
    event = parser.parse(sample_log)

    assert isinstance(event, UnifiedEvent)
    assert event.source_ip == "192.168.1.100"
    assert event.destination_ip == "10.0.0.50"
    assert event.severity == "Warning"
    assert "deny" in event.event_type
    assert "outside_acl" in event.event_type
    assert event.original_event == sample_log

def test_fortinet_parser():
    parser = FortinetParser()
    sample_log = (
        'date=2026-08-25 time=19:30:00 devname="FG100D-FW" type="traffic" '
        'level="notice" srcip=192.168.1.105 dstip=10.0.0.10 action="accept" policyid=42'
    )

    assert parser.matches(sample_log) is True
    event = parser.parse(sample_log)

    assert isinstance(event, UnifiedEvent)
    assert event.source_ip == "192.168.1.105"
    assert event.destination_ip == "10.0.0.10"
    assert event.severity == "Informational"
    assert "fortinet:accept:policy_42" in event.event_type
    assert event.original_event == sample_log

def test_suricata_parser():
    parser = SuricataParser()
    sample_log = (
        '{"timestamp":"2026-08-25T19:30:00.000Z","event_type":"alert",'
        '"src_ip":"192.168.1.200","dest_ip":"10.0.0.5","alert":{'
        '"signature":"ET MALWARE Compromised Host Activity","severity":1}}'
    )

    assert parser.matches(sample_log) is True
    event = parser.parse(sample_log)

    assert isinstance(event, UnifiedEvent)
    assert event.source_ip == "192.168.1.200"
    assert event.destination_ip == "10.0.0.5"
    assert event.severity == "Critical"
    assert "ET MALWARE" in event.event_type
    assert event.original_event == sample_log

def test_pfsense_parser():
    parser = PfSenseParser()
    sample_log = (
        "filterlog[12345]: 4,1,,1000000103,em0,match,block,in,4,0x0,,64,12345,0,DF,6,tcp,60,"
        "192.168.1.88,10.0.0.1,54321,80,0,S,12345678,,1024,,"
    )

    assert parser.matches(sample_log) is True
    event = parser.parse(sample_log)

    assert isinstance(event, UnifiedEvent)
    assert event.source_ip == "192.168.1.88"
    assert event.destination_ip == "10.0.0.1"
    assert event.severity == "Warning"
    assert "pfsense:block:em0:tcp" in event.event_type
    assert event.original_event == sample_log

def test_raw_event_hash_merkle_traceability():
    audit_merkle_tree.reset()
    dynamic_parser = DynamicParser()
    
    raw_line = (
        "%ASA-4-106023: Deny tcp src outside:192.168.1.100/54321 "
        'dst inside:10.0.0.50/80 by access-group "outside_acl"'
    )
    
    # 1. Raw payload is hashed into Merkle Tree on ingestion
    leaf_hash = audit_merkle_tree.add_leaf(raw_line)
    
    # 2. DynamicParser parses line into UnifiedEvent
    event = dynamic_parser.parse_single(raw_line)

    # 3. Verify raw_event_hash is stamped on UnifiedEvent
    assert event.raw_event_hash is not None
    assert event.raw_event_hash == leaf_hash
    assert event.raw_event_hash == MerkleTree.hash_payload(raw_line)

    # 4. Verify raw_event_hash links back directly to Merkle Tree audit entry
    assert audit_merkle_tree.verify_leaf(event.raw_event_hash) is True
