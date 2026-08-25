import hashlib
from typing import List, Union

class MerkleTree:
    """
    In-memory Merkle Tree implementing SHA-256 hash chaining
    for zero-trust, tamper-proof forensic audit verification.
    """
    def __init__(self):
        self.leaves: List[str] = []

    @staticmethod
    def hash_payload(data: Union[bytes, str]) -> str:
        """Computes SHA-256 hex digest of raw data payload."""
        if isinstance(data, str):
            data = data.encode("utf-8")
        return hashlib.sha256(data).hexdigest()

    def add_leaf(self, payload: Union[bytes, str]) -> str:
        """
        Hashes input payload (if not already hashed) and appends to Merkle tree.
        Returns the SHA-256 leaf hash.
        """
        leaf_hash = self.hash_payload(payload)
        self.leaves.append(leaf_hash)
        return leaf_hash

    def get_leaf_hashes(self) -> List[str]:
        """Returns ordered list of all leaf hashes."""
        return list(self.leaves)

    def get_root_hash(self) -> str:
        """
        Computes and returns the root SHA-256 hash of the Merkle tree.
        Returns empty string if no leaves exist.
        """
        if not self.leaves:
            return ""

        current_level = list(self.leaves)
        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                # If odd number of nodes at this level, duplicate last node
                right = current_level[i + 1] if i + 1 < len(current_level) else left
                combined = (left + right).encode("utf-8")
                parent_hash = hashlib.sha256(combined).hexdigest()
                next_level.append(parent_hash)
            current_level = next_level

        return current_level[0]

    def verify_leaf(self, leaf_hash: str) -> bool:
        """Checks whether a specific leaf hash exists in the tree."""
        return leaf_hash in self.leaves

    def reset(self):
        """Clears all leaves in the tree."""
        self.leaves.clear()

# Global in-memory Merkle Tree instance for ingestion audit chain
audit_merkle_tree = MerkleTree()
