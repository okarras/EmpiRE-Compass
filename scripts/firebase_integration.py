#!/usr/bin/env python3
"""
Firebase integration for EmpiRE Compass statistics.
This script handles reading from and writing to Firebase Firestore.
"""

import os
import json
from datetime import datetime, timezone
from typing import Dict, Any

try:
    import firebase_admin
    from firebase_admin import credentials
    from firebase_admin import firestore
except ImportError:
    raise ImportError(
        "Firebase Admin SDK not installed. Please install it with: pip install firebase-admin"
    )


class FirebaseManager:
    def __init__(self, service_account_path: str = None):
        """Initialize Firebase connection."""
        self.db = None
        self.initialize_firebase(service_account_path)

    def initialize_firebase(self, service_account_path: str = None):
        """Initialize Firebase Admin SDK."""
        try:
            if not firebase_admin._apps:
                if service_account_path and os.path.exists(service_account_path):
                    # Use service account key file
                    cred = credentials.Certificate(service_account_path)
                    firebase_admin.initialize_app(cred)
                else:
                    # Try to use environment variables or default credentials
                    firebase_admin.initialize_app()

                self.db = firestore.client()
                print("Firebase initialized successfully")
            else:
                self.db = firestore.client()
                print("Firebase already initialized")
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            raise

    def update_statistics(self, statistics_data: Dict[str, Any]) -> bool:
        """Update statistics in Firebase Firestore."""
        try:
            # Add timestamp
            statistics_data["updatedAt"] = datetime.now(timezone.utc).isoformat()

            # Update the document
            doc_ref = self.db.collection("Statistics").document("empire-statistics")
            doc_ref.set(statistics_data)

            print("Statistics updated successfully in Firebase")
            return True
        except Exception as e:
            print(f"Error updating statistics in Firebase: {e}")
            return False

    def get_statistics(self) -> Dict[str, Any]:
        """Get statistics from Firebase Firestore."""
        try:
            doc_ref = self.db.collection("Statistics").document("empire-statistics")
            doc = doc_ref.get()

            if doc.exists:
                return doc.to_dict()
            else:
                print("No statistics document found in Firebase")
                return {}
        except Exception as e:
            print(f"Error getting statistics from Firebase: {e}")
            return {}


def main():
    """Test the Firebase integration."""
    firebase_manager = FirebaseManager()

    # Test data
    test_data = {
        "paperCount": 100,
        "resources": 1000,
        "literals": 2000,
        "predicates": 500,
        "distinctResources": 800,
        "distinctLiterals": 1500,
        "distinctPredicates": 400,
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
    }

    # Update statistics
    success = firebase_manager.update_statistics(test_data)
    if success:
        print("Test update successful")
    else:
        print("Test update failed")

    # Get statistics
    retrieved_data = firebase_manager.get_statistics()
    print(f"Retrieved data: {retrieved_data}")


if __name__ == "__main__":
    main()
