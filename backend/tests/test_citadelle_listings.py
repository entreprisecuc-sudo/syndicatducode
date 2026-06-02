"""
Backend tests — La Citadelle Numérique Phase B (Marketplace Annonces)
Tests: public listings, authenticated user flows, admin validate/reject
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

CITADELLE_AUTH_URL = f"{BASE_URL}/api/citadelle/auth/login"
ADMIN_AUTH_URL = f"{BASE_URL}/api/auth/login"

# Test credentials
CITADELLE_USER = {"email": "jean.test.citadelle@test.fr", "password": "TestPass1"}
ADMIN_USER = {"email": "admin@syndicatducode.fr", "password": "AdminSyndicat2025!"}


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def citadelle_token():
    """Get Citadelle user token"""
    res = requests.post(CITADELLE_AUTH_URL, json=CITADELLE_USER)
    if res.status_code != 200:
        pytest.skip(f"Citadelle auth failed: {res.status_code} {res.text}")
    data = res.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in response: {data}"
    return token


@pytest.fixture(scope="module")
def admin_token():
    """Get Admin (Syndicat) token"""
    res = requests.post(ADMIN_AUTH_URL, json=ADMIN_USER)
    if res.status_code != 200:
        pytest.skip(f"Admin auth failed: {res.status_code} {res.text}")
    data = res.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in response: {data}"
    return token


@pytest.fixture(scope="module")
def citadelle_client(citadelle_token):
    """Requests session with Citadelle user auth"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {citadelle_token}"
    })
    return session


@pytest.fixture(scope="module")
def admin_client(admin_token):
    """Requests session with Admin auth"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}"
    })
    return session


# ── Test 1: Public listings endpoint ─────────────────────────────────────────

class TestPublicListings:
    """GET /api/citadelle/listings — public, no auth required"""

    def test_public_listings_returns_correct_structure(self):
        """API returns {listings, total, page, pages}"""
        res = requests.get(f"{BASE_URL}/api/citadelle/listings")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert "listings" in data, "Missing 'listings' key"
        assert "total" in data, "Missing 'total' key"
        assert "page" in data, "Missing 'page' key"
        assert "pages" in data, "Missing 'pages' key"
        assert isinstance(data["listings"], list), "listings should be a list"
        assert isinstance(data["total"], int), "total should be int"
        assert data["page"] == 1, "Default page should be 1"
        assert data["pages"] >= 1, "Pages should be >= 1"
        print(f"[OK] Public listings: total={data['total']}, pages={data['pages']}")

    def test_public_listings_no_mongo_id(self):
        """Listings should not expose MongoDB _id"""
        res = requests.get(f"{BASE_URL}/api/citadelle/listings")
        assert res.status_code == 200
        data = res.json()
        for listing in data["listings"]:
            assert "_id" not in listing, "MongoDB _id should not be exposed"
        print("[OK] No _id field in listings")

    def test_public_listings_only_active(self):
        """Public listings should only return active status"""
        res = requests.get(f"{BASE_URL}/api/citadelle/listings")
        assert res.status_code == 200
        data = res.json()
        for listing in data["listings"]:
            assert listing.get("status") == "active", f"Non-active listing in public results: {listing.get('status')}"
        print(f"[OK] All {len(data['listings'])} public listings have status=active")

    def test_public_listings_filter_by_type(self):
        """Filter by type=website should work"""
        res = requests.get(f"{BASE_URL}/api/citadelle/listings", params={"type": "website"})
        assert res.status_code == 200
        data = res.json()
        for listing in data["listings"]:
            assert listing.get("type") == "website"
        print(f"[OK] Type filter: {len(data['listings'])} website listings")

    def test_public_listings_sort_options(self):
        """Sort options should not cause errors"""
        for sort in ["recent", "price_asc", "price_desc", "revenue"]:
            res = requests.get(f"{BASE_URL}/api/citadelle/listings", params={"sort": sort})
            assert res.status_code == 200, f"Sort '{sort}' failed: {res.status_code}"
        print("[OK] All sort options work")

    def test_public_listings_pagination(self):
        """Pagination params should work"""
        res = requests.get(f"{BASE_URL}/api/citadelle/listings", params={"page": 1, "limit": 5})
        assert res.status_code == 200
        data = res.json()
        assert len(data["listings"]) <= 5
        assert data["limit"] == 5
        print(f"[OK] Pagination: got {len(data['listings'])} listings with limit=5")

    def test_public_listings_budget_filter(self):
        """Budget filter should work"""
        res = requests.get(f"{BASE_URL}/api/citadelle/listings", params={"budget": "0-5000"})
        assert res.status_code == 200
        data = res.json()
        for listing in data["listings"]:
            assert listing.get("price", 0) <= 5000, f"Price {listing.get('price')} exceeds budget filter"
        print(f"[OK] Budget filter: {len(data['listings'])} listings under 5000€")


# ── Test 2: Auth flows ────────────────────────────────────────────────────────

class TestCitadelleAuth:
    """Citadelle user auth via /api/citadelle/auth/login"""

    def test_citadelle_login_success(self):
        """Valid Citadelle credentials should return token"""
        res = requests.post(CITADELLE_AUTH_URL, json=CITADELLE_USER)
        assert res.status_code == 200, f"Login failed: {res.status_code} {res.text}"
        data = res.json()
        token = data.get("access_token") or data.get("token")
        assert token, f"No token in response: {data}"
        print(f"[OK] Citadelle login successful for {CITADELLE_USER['email']}")

    def test_citadelle_login_wrong_password(self):
        """Wrong password should return 401 or 403"""
        res = requests.post(CITADELLE_AUTH_URL, json={"email": CITADELLE_USER["email"], "password": "wrongpass"})
        assert res.status_code in [400, 401, 403], f"Expected 4xx, got {res.status_code}"
        print(f"[OK] Wrong password correctly rejected: {res.status_code}")

    def test_admin_login_success(self):
        """Admin login via Syndicat auth"""
        res = requests.post(ADMIN_AUTH_URL, json=ADMIN_USER)
        assert res.status_code == 200, f"Admin login failed: {res.status_code} {res.text}"
        data = res.json()
        token = data.get("access_token") or data.get("token")
        assert token, f"No token in admin response: {data}"
        print(f"[OK] Admin login successful")


# ── Test 3: Create listing (authenticated) ────────────────────────────────────

TEST_LISTING_ID = None
TEST_LISTING_SLUG = None

class TestCreateListing:
    """POST /api/citadelle/listings — Citadelle user required"""

    def test_create_listing_unauthenticated_fails(self):
        """Creating a listing without auth should return 401/403"""
        payload = {
            "title": "Test listing unauthorized",
            "type": "website",
            "short_description": "This is a short description for the listing",
            "description": "Detailed description of the test listing for unauthorized test. " * 2,
            "price": 1000
        }
        res = requests.post(f"{BASE_URL}/api/citadelle/listings", json=payload)
        assert res.status_code in [401, 403], f"Expected 401/403, got {res.status_code}"
        print(f"[OK] Unauthenticated listing creation rejected: {res.status_code}")

    def test_create_listing_success(self, citadelle_client):
        """Valid listing creation should return 201 with status=pending"""
        global TEST_LISTING_ID, TEST_LISTING_SLUG
        payload = {
            "title": "TEST_Blog culinaire — 2500€ revenus mensuels",
            "type": "website",
            "short_description": "Blog culinaire français avec 45k visiteurs/mois et 2500€ de revenus publicitaires",
            "description": "Blog culinaire créé en 2019, spécialisé dans la cuisine méditerranéenne. "
                           "Il génère 2500€/mois via Google AdSense et des partenariats. "
                           "Vendu pour raison de réorientation professionnelle.",
            "price": 15000,
            "price_negotiable": True,
            "monthly_revenue": 2500,
            "monthly_traffic": 45000,
            "age_months": 60,
            "niche": "Cuisine",
            "technologies": ["WordPress", "Google Analytics"],
        }
        res = citadelle_client.post(f"{BASE_URL}/api/citadelle/listings", json=payload)
        assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
        data = res.json()
        assert data["status"] == "pending", f"Expected 'pending', got '{data['status']}'"
        assert data["title"] == payload["title"]
        assert data["price"] == payload["price"]
        assert "id" in data, "Missing 'id' in response"
        assert "slug" in data, "Missing 'slug' in response"
        assert "_id" not in data, "MongoDB _id should not be exposed"
        TEST_LISTING_ID = data["id"]
        TEST_LISTING_SLUG = data["slug"]
        print(f"[OK] Listing created: id={TEST_LISTING_ID}, slug={TEST_LISTING_SLUG}, status=pending")

    def test_create_listing_invalid_type_fails(self, citadelle_client):
        """Invalid type should be rejected"""
        payload = {
            "title": "Test invalid type",
            "type": "invalid_type",
            "short_description": "Short description for invalid type test",
            "description": "Detailed description for invalid type test. " * 3,
            "price": 500
        }
        res = citadelle_client.post(f"{BASE_URL}/api/citadelle/listings", json=payload)
        assert res.status_code in [400, 422], f"Expected 400/422, got {res.status_code}"
        print(f"[OK] Invalid type correctly rejected: {res.status_code}")

    def test_create_listing_short_title_fails(self, citadelle_client):
        """Title too short should be rejected"""
        payload = {
            "title": "Hi",
            "type": "website",
            "short_description": "Short description for title validation test",
            "description": "Detailed description for title validation test. " * 3,
            "price": 500
        }
        res = citadelle_client.post(f"{BASE_URL}/api/citadelle/listings", json=payload)
        assert res.status_code in [400, 422], f"Expected 400/422 for short title, got {res.status_code}"
        print(f"[OK] Short title correctly rejected: {res.status_code}")


# ── Test 4: My listings ───────────────────────────────────────────────────────

class TestMyListings:
    """GET /api/citadelle/listings/my — Citadelle user required"""

    def test_my_listings_authenticated(self, citadelle_client):
        """Should return seller's listings"""
        res = citadelle_client.get(f"{BASE_URL}/api/citadelle/listings/my")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert "listings" in data, "Missing 'listings' key"
        assert isinstance(data["listings"], list)
        print(f"[OK] My listings: {len(data['listings'])} annonces")

    def test_my_listings_includes_pending(self, citadelle_client):
        """After creating a listing, it should appear in my listings with status=pending"""
        if not TEST_LISTING_ID:
            pytest.skip("No test listing created yet")
        res = citadelle_client.get(f"{BASE_URL}/api/citadelle/listings/my")
        assert res.status_code == 200
        data = res.json()
        ids = [l["id"] for l in data["listings"]]
        assert TEST_LISTING_ID in ids, f"Test listing {TEST_LISTING_ID} not in my listings"
        test_listing = next(l for l in data["listings"] if l["id"] == TEST_LISTING_ID)
        assert test_listing["status"] == "pending"
        print(f"[OK] Pending listing found in my listings: {TEST_LISTING_ID}")

    def test_my_listings_unauthenticated_fails(self):
        """My listings without auth should return 401/403"""
        res = requests.get(f"{BASE_URL}/api/citadelle/listings/my")
        assert res.status_code in [401, 403], f"Expected 401/403, got {res.status_code}"
        print(f"[OK] Unauthenticated my listings rejected: {res.status_code}")


# ── Test 5: Admin endpoints ───────────────────────────────────────────────────

class TestAdminListings:
    """Admin endpoints — /api/citadelle/admin/listings/*"""

    def test_admin_list_all_listings(self, admin_client):
        """Admin should see all listings including pending"""
        res = admin_client.get(f"{BASE_URL}/api/citadelle/admin/listings")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert "listings" in data
        assert "counts" in data
        assert "total" in data
        print(f"[OK] Admin can list all listings: total={data['total']}, counts={data['counts']}")

    def test_admin_list_pending_only(self, admin_client):
        """Admin can filter by status=pending"""
        res = admin_client.get(f"{BASE_URL}/api/citadelle/admin/listings", params={"status": "pending"})
        assert res.status_code == 200
        data = res.json()
        for listing in data["listings"]:
            assert listing["status"] == "pending"
        print(f"[OK] Admin pending filter: {len(data['listings'])} pending listings")

    def test_admin_requires_auth(self):
        """Admin endpoint without auth should return 401/403"""
        res = requests.get(f"{BASE_URL}/api/citadelle/admin/listings")
        assert res.status_code in [401, 403], f"Expected 401/403, got {res.status_code}"
        print(f"[OK] Unauthenticated admin access rejected: {res.status_code}")

    def test_admin_citadelle_user_cannot_access_admin(self, citadelle_client):
        """Citadelle user (non-admin) should not access admin endpoints"""
        res = citadelle_client.get(f"{BASE_URL}/api/citadelle/admin/listings")
        assert res.status_code == 403, f"Expected 403, got {res.status_code}"
        print(f"[OK] Non-admin citadelle user blocked from admin: {res.status_code}")

    def test_admin_validate_listing(self, admin_client):
        """Admin can validate a pending listing → status becomes active"""
        if not TEST_LISTING_ID:
            pytest.skip("No test listing to validate")
        res = admin_client.patch(f"{BASE_URL}/api/citadelle/admin/listings/{TEST_LISTING_ID}/validate")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert "message" in data
        print(f"[OK] Admin validated listing: {TEST_LISTING_ID}, response: {data['message']}")

    def test_listing_appears_in_public_after_validation(self, admin_client):
        """After validation, the listing should appear in public listings"""
        if not TEST_LISTING_ID:
            pytest.skip("No test listing")
        # Wait a moment for consistency
        time.sleep(1)
        res = requests.get(f"{BASE_URL}/api/citadelle/listings")
        assert res.status_code == 200
        data = res.json()
        ids = [l["id"] for l in data["listings"]]
        # Check if listing is now active
        assert TEST_LISTING_ID in ids, f"Validated listing {TEST_LISTING_ID} not in public listings"
        print(f"[OK] Validated listing appears in public listings")

    def test_listing_detail_accessible_by_slug(self):
        """Validated listing detail accessible by slug"""
        if not TEST_LISTING_SLUG:
            pytest.skip("No test listing slug")
        res = requests.get(f"{BASE_URL}/api/citadelle/listings/{TEST_LISTING_SLUG}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data["slug"] == TEST_LISTING_SLUG
        assert data["status"] == "active"
        print(f"[OK] Listing detail accessible: slug={TEST_LISTING_SLUG}")

    def test_admin_cannot_validate_active_listing(self, admin_client):
        """Validating an already active listing should return 400"""
        if not TEST_LISTING_ID:
            pytest.skip("No test listing")
        res = admin_client.patch(f"{BASE_URL}/api/citadelle/admin/listings/{TEST_LISTING_ID}/validate")
        assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
        print(f"[OK] Double validation correctly rejected: {res.status_code}")


# ── Test 6: Reject flow ────────────────────────────────────────────────────────

SECOND_LISTING_ID = None

class TestRejectFlow:
    """Admin reject + member edit flow"""

    def test_create_second_listing_for_reject(self, citadelle_client):
        """Create another listing to test rejection"""
        global SECOND_LISTING_ID
        payload = {
            "title": "TEST_SaaS de gestion de stock — 500€/mois",
            "type": "saas",
            "short_description": "Application SaaS de gestion de stock pour PME, 500€ revenus récurrents",
            "description": "Application web SaaS de gestion de stock créée en 2022. "
                           "12 clients PME abonnés à 42€/mois. Churn très faible. "
                           "Vendu car pivot stratégique vers B2C.",
            "price": 8000,
            "monthly_revenue": 500,
        }
        res = citadelle_client.post(f"{BASE_URL}/api/citadelle/listings", json=payload)
        assert res.status_code == 201, f"Failed to create second listing: {res.status_code}: {res.text}"
        SECOND_LISTING_ID = res.json()["id"]
        print(f"[OK] Second listing created for reject test: {SECOND_LISTING_ID}")

    def test_admin_reject_listing(self, admin_client):
        """Admin can reject a pending listing with reason"""
        if not SECOND_LISTING_ID:
            pytest.skip("No second listing to reject")
        reason = "Informations insuffisantes sur le trafic et la source des revenus"
        res = admin_client.patch(
            f"{BASE_URL}/api/citadelle/admin/listings/{SECOND_LISTING_ID}/reject",
            json={"reason": reason}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert "message" in data
        print(f"[OK] Admin rejected listing: {SECOND_LISTING_ID}")

    def test_rejected_listing_shows_reason_in_my_listings(self, citadelle_client):
        """Rejected listing should show rejection reason in my listings"""
        if not SECOND_LISTING_ID:
            pytest.skip("No second listing")
        res = citadelle_client.get(f"{BASE_URL}/api/citadelle/listings/my")
        assert res.status_code == 200
        data = res.json()
        listing = next((l for l in data["listings"] if l["id"] == SECOND_LISTING_ID), None)
        assert listing is not None, f"Rejected listing {SECOND_LISTING_ID} not found in my listings"
        assert listing["status"] == "rejected", f"Expected 'rejected', got '{listing['status']}'"
        assert listing.get("rejection_reason"), "Rejection reason should be present"
        print(f"[OK] Rejection reason visible in my listings: '{listing['rejection_reason']}'")

    def test_update_rejected_listing_goes_pending(self, citadelle_client):
        """Updating a rejected listing should re-submit it as pending"""
        if not SECOND_LISTING_ID:
            pytest.skip("No second listing")
        update_payload = {
            "title": "TEST_SaaS de gestion de stock v2 — 500€/mois récurrents",
            "short_description": "Application SaaS de gestion de stock pour PME, 500€/mois de revenus récurrents mesurés",
            "description": "Application SaaS de gestion de stock créée en 2022. 12 clients PME abonnés à 42€/mois. "
                           "Trafic: 3000 sessions/mois (GA4 vérifiable). Churn < 5%. Vendu pour pivot B2C.",
            "price": 8000,
            "monthly_revenue": 500,
            "monthly_traffic": 3000,
        }
        res = citadelle_client.patch(
            f"{BASE_URL}/api/citadelle/listings/{SECOND_LISTING_ID}",
            json=update_payload
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data["status"] == "pending", f"Expected 'pending' after update, got '{data['status']}'"
        assert data.get("rejection_reason") is None, "Rejection reason should be cleared after update"
        print(f"[OK] Updated rejected listing is now pending again")

    def test_admin_reject_short_reason_fails(self, admin_client):
        """Reject with too short reason should fail"""
        if not SECOND_LISTING_ID:
            pytest.skip("No second listing")
        res = admin_client.patch(
            f"{BASE_URL}/api/citadelle/admin/listings/{SECOND_LISTING_ID}/reject",
            json={"reason": "Trop court"}
        )
        assert res.status_code in [400, 422], f"Expected 400/422, got {res.status_code}"
        print(f"[OK] Short rejection reason correctly rejected: {res.status_code}")


# ── Test 7: Delete flow ───────────────────────────────────────────────────────

class TestDeleteListing:
    """DELETE /api/citadelle/listings/:id"""

    def test_delete_own_pending_listing(self, citadelle_client):
        """Owner can delete their own pending/rejected listing"""
        # Create a listing to delete
        payload = {
            "title": "TEST_Listing to delete soon",
            "type": "webapp",
            "short_description": "This listing will be deleted shortly in the test suite",
            "description": "Test listing created specifically to test the delete functionality. Will be removed.",
            "price": 500
        }
        res = citadelle_client.post(f"{BASE_URL}/api/citadelle/listings", json=payload)
        assert res.status_code == 201
        listing_id = res.json()["id"]

        # Delete it
        res = citadelle_client.delete(f"{BASE_URL}/api/citadelle/listings/{listing_id}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert "message" in data

        # Verify it's gone (from my listings)
        res2 = citadelle_client.get(f"{BASE_URL}/api/citadelle/listings/my")
        ids = [l["id"] for l in res2.json()["listings"]]
        assert listing_id not in ids, "Deleted listing should not appear in my listings"
        print(f"[OK] Listing deleted successfully and removed from my listings")

    def test_delete_active_listing_fails(self, admin_client, citadelle_client):
        """Cannot delete an active listing"""
        if not TEST_LISTING_ID:
            pytest.skip("No active test listing")
        res = citadelle_client.delete(f"{BASE_URL}/api/citadelle/listings/{TEST_LISTING_ID}")
        assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
        print(f"[OK] Deleting active listing correctly rejected: {res.status_code}")


# ── Cleanup ────────────────────────────────────────────────────────────────────

class TestCleanup:
    """Cleanup TEST_ data after all tests"""

    def test_cleanup_test_listings(self, admin_client):
        """Admin removes all TEST_ listings"""
        res = admin_client.get(f"{BASE_URL}/api/citadelle/admin/listings", params={"limit": 100})
        assert res.status_code == 200
        listings = res.json().get("listings", [])
        test_listings = [l for l in listings if l.get("title", "").startswith("TEST_")]
        print(f"Found {len(test_listings)} TEST_ listings to clean up")

        for listing in test_listings:
            if listing["status"] == "active":
                # Can't delete active ones directly via listing owner route
                # Use admin can still delete via admin route if endpoint exists
                print(f"  Skipping active listing: {listing['id']}")
            else:
                # These should be deletable
                print(f"  TEST_ listing {listing['id']}: {listing['status']}")
        print("[OK] Cleanup audit done (manual cleanup may be needed for active TEST_ listings)")
