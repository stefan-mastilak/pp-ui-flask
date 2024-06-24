resource "google_storage_bucket" "bucket" {
  name     = "severa-tokens"
  location = var.region
  force_destroy = true  # This allows terraform to delete the bucket even if it has contents. Be careful with this option.
}