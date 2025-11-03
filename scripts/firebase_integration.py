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
        """Initialize Firebase connection.

        Args:
            service_account_path: Path to service account JSON file (optional)
                                  If not provided, will try environment variable FIREBASE_SERVICE_ACCOUNT_KEY
        """
        self.db = None
        self.initialize_firebase(service_account_path)

    def initialize_firebase(self, service_account_path: str = None):
        """Initialize Firebase Admin SDK.

        Priority order:
        1. Service account file path (if provided and exists)
        2. FIREBASE_SERVICE_ACCOUNT_KEY environment variable (JSON string)
        3. Default credentials (only if neither 1 nor 2 are available)
        """
        try:
            if not firebase_admin._apps:
                initialized = False

                # Priority 1: Try service account file path
                if service_account_path and os.path.exists(service_account_path):
                    try:
                        cred = credentials.Certificate(service_account_path)
                        firebase_admin.initialize_app(cred)
                        print("✅ Firebase initialized with service account file")
                        initialized = True
                    except Exception as e:
                        raise ValueError(
                            f"Failed to initialize Firebase with service account file '{service_account_path}': {e}"
                        )

                # Priority 2: Try environment variable (if file wasn't used or doesn't exist)
                if not initialized and os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY"):
                    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
                    if service_account_json.strip():
                        try:
                            # Parse JSON string from environment variable
                            service_account_dict = json.loads(service_account_json)
                            cred = credentials.Certificate(service_account_dict)
                            firebase_admin.initialize_app(cred)
                            print("✅ Firebase initialized with environment variable")
                            initialized = True
                        except json.JSONDecodeError as e:
                            raise ValueError(
                                f"FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON: {e}"
                            )
                        except Exception as e:
                            raise ValueError(
                                f"Failed to initialize Firebase with environment variable: {e}"
                            )
                    else:
                        print("⚠️  FIREBASE_SERVICE_ACCOUNT_KEY is set but empty")

                # Priority 3: Try default credentials (only if nothing else worked)
                if not initialized:
                    try:
                        firebase_admin.initialize_app()
                        print("✅ Firebase initialized with default credentials")
                        initialized = True
                    except Exception as default_cred_error:
                        # Provide helpful error message
                        error_msg = (
                            "❌ Failed to initialize Firebase. No valid credentials found.\n"
                            "   Please provide one of the following:\n"
                            "   1. Service account file: firebase-service-account.json\n"
                            "   2. Environment variable: FIREBASE_SERVICE_ACCOUNT_KEY (JSON string)\n"
                            "   3. Google Cloud Application Default Credentials (gcloud auth application-default login)"
                        )
                        if service_account_path:
                            error_msg += f"\n   Note: Tried file path '{service_account_path}' but file not found."
                        if not os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY"):
                            error_msg += "\n   Note: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set."
                        error_msg += (
                            f"\n   Default credentials error: {default_cred_error}"
                        )
                        raise ValueError(error_msg)

                self.db = firestore.client()
            else:
                self.db = firestore.client()
                print("ℹ️  Firebase already initialized")
        except Exception as e:
            print(f"❌ Error initializing Firebase: {e}")
            raise

    def update_statistics(
        self,
        statistics_data: Dict[str, Any],
        template_id: str = "R186491",
        statistic_id: str = "empire-statistics",
    ) -> bool:
        """Update statistics in Firebase Firestore.

        Args:
            statistics_data: Dictionary containing statistics data to update
            template_id: Template ID (defaults to "R186491")
            statistic_id: Statistic document ID (defaults to "empire-statistics")

        Statistics are now stored in nested structure:
        Templates/{template_id}/Statistics/{statistic_id}
        """
        try:
            # Ensure the Template document exists first (Firestore requirement)
            template_ref = self.db.collection("Templates").document(template_id)
            template_doc = template_ref.get()
            if not template_doc.exists:
                # Create the template document with minimal data
                template_ref.set(
                    {
                        "id": template_id,
                        "createdAt": datetime.now(timezone.utc).isoformat(),
                    },
                    merge=True,
                )
                print(f"Created Template document: {template_id}")

            # Prepare statistics data
            stats_copy = statistics_data.copy()
            stats_copy["updatedAt"] = datetime.now(timezone.utc).isoformat()
            stats_copy["id"] = statistic_id

            # Debug: Print what we're about to write
            print(f"\n📝 Writing statistics to Firebase:")
            print(f"   Path: Templates/{template_id}/Statistics/{statistic_id}")
            print(f"   Fields: {list(stats_copy.keys())}")
            print(
                f"   Sample values: total_statements={stats_copy.get('total_statements', 'N/A')}, "
                f"global_distinct_resources={stats_copy.get('global_distinct_resources', 'N/A')}"
            )

            # Update the document using new nested path structure
            doc_ref = (
                self.db.collection("Templates")
                .document(template_id)
                .collection("Statistics")
                .document(statistic_id)
            )

            # Use set() to overwrite the document
            # Note: Admin SDK bypasses security rules, so rules won't prevent this
            doc_ref.set(stats_copy, merge=False)
            print(f"   Document set() called successfully")

            # Small delay to ensure write propagates
            import time

            time.sleep(0.5)

            # Verify the write by reading it back
            verify_doc = doc_ref.get()
            if verify_doc.exists:
                verify_data = verify_doc.to_dict()
                print(f"\n✅ Statistics verified in Firebase")
                print(f"   Document exists: True")
                print(f"   Document ID: {verify_doc.id}")
                print(f"   Fields written: {len(verify_data)} fields")
                print(f"   First few fields: {dict(list(verify_data.items())[:5])}")

                # Check if critical fields are present
                critical_fields = [
                    "total_statements",
                    "paperCount",
                    "global_distinct_resources",
                ]
                missing_fields = [f for f in critical_fields if f not in verify_data]
                if missing_fields:
                    print(f"   ⚠️  WARNING: Missing fields: {missing_fields}")
                else:
                    print(f"   ✅ All critical fields present")

                return True
            else:
                print(f"\n❌ ERROR: Document was not created in Firebase!")
                print(f"   Path: Templates/{template_id}/Statistics/{statistic_id}")
                print(f"   This might indicate a permissions or network issue")
                return False

        except Exception as e:
            import traceback

            print(f"❌ Error updating statistics in Firebase: {e}")
            print(f"   Traceback: {traceback.format_exc()}")
            return False

    def get_statistics(
        self, template_id: str = "R186491", statistic_id: str = "empire-statistics"
    ) -> Dict[str, Any]:
        """Get statistics from Firebase Firestore.

        Args:
            template_id: Template ID (defaults to "R186491")
            statistic_id: Statistic document ID (defaults to "empire-statistics")

        Returns:
            Dictionary containing statistics data or empty dict if not found
        """
        try:
            doc_ref = (
                self.db.collection("Templates")
                .document(template_id)
                .collection("Statistics")
                .document(statistic_id)
            )
            doc = doc_ref.get()

            if doc.exists:
                return doc.to_dict()
            else:
                print(
                    f"No statistics document found at Templates/{template_id}/Statistics/{statistic_id}"
                )
                return {}
        except Exception as e:
            print(f"Error getting statistics from Firebase: {e}")
            return {}


def main():
    """Test the Firebase integration."""
    # Try multiple possible locations for service account file
    possible_paths = [
        "./firebase-service-account.json",
        "firebase-service-account.json",
        os.path.join(os.path.dirname(__file__), "firebase-service-account.json"),
    ]

    service_account_path = None
    for path in possible_paths:
        if os.path.exists(path):
            service_account_path = path
            print(f"Found service account file at: {path}")
            break

    if not service_account_path:
        print("Service account file not found, trying environment variable...")
        if not os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY"):
            print("\n⚠️  No credentials found!")
            print("Please either:")
            print("  1. Place firebase-service-account.json in the root directory")
            print("  2. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable")
            print("\nSee FIREBASE_SETUP.md for details")

    firebase_manager = FirebaseManager(service_account_path)

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

    # Update statistics using new nested path structure
    success = firebase_manager.update_statistics(
        test_data, template_id="R186491", statistic_id="empire-statistics"
    )
    if success:
        print("Test update successful")
    else:
        print("Test update failed")

    # Get statistics using new nested path structure
    retrieved_data = firebase_manager.get_statistics(
        template_id="R186491", statistic_id="empire-statistics"
    )
    print(f"Retrieved data: {retrieved_data}")


if __name__ == "__main__":
    main()
