import hashlib
import pytest
from app.audit.hash_chain import MerkleTree, audit_merkle_tree

def test_merkle_tree_empty():
    tree = MerkleTree()
    assert tree.get_root_hash() == ""
    assert tree.get_leaf_hashes() == []

def test_merkle_tree_single_leaf():
    tree = MerkleTree()
    payload = b"raw log payload 1"
    expected_hash = hashlib.sha256(payload).hexdigest()

    leaf_hash = tree.add_leaf(payload)
    assert leaf_hash == expected_hash
    assert tree.get_root_hash() == expected_hash
    assert tree.verify_leaf(expected_hash) is True

def test_merkle_tree_multiple_leaves():
    tree = MerkleTree()
    p1 = b"log event A"
    p2 = b"log event B"

    h1 = tree.add_leaf(p1)
    root1 = tree.get_root_hash()
    assert root1 == h1

    h2 = tree.add_leaf(p2)
    root2 = tree.get_root_hash()
    
    # Root hash must change after adding a new leaf
    assert root2 != root1

    # Verify manual SHA-256 calculation for 2 leaves
    combined = (h1 + h2).encode("utf-8")
    expected_root2 = hashlib.sha256(combined).hexdigest()
    assert root2 == expected_root2

    assert tree.verify_leaf(h1) is True
    assert tree.verify_leaf(h2) is True
    assert tree.verify_leaf("nonexistent_hash") is False

def test_merkle_tree_odd_number_of_leaves():
    tree = MerkleTree()
    h1 = tree.add_leaf(b"A")
    h2 = tree.add_leaf(b"B")
    h3 = tree.add_leaf(b"C")

    # Level 1: pair (h1, h2) -> parent12, pair (h3, h3) -> parent33
    p12 = hashlib.sha256((h1 + h2).encode("utf-8")).hexdigest()
    p33 = hashlib.sha256((h3 + h3).encode("utf-8")).hexdigest()
    expected_root = hashlib.sha256((p12 + p33).encode("utf-8")).hexdigest()

    assert tree.get_root_hash() == expected_root
