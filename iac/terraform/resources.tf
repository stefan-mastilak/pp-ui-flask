
# Cloud run service

# will enable later on
resource "google_cloud_run_service" "cloud_run_service" {
  depends_on = [
    google_project_service.cloud_compute_engine_enable_api,
    google_project_service.cloud_run_admin_enable_api
  ]
  location = var.region
  name     = "pp-ui-app"

  template {
    spec {
      service_account_name = google_service_account.cloudbuild_service_account.email
      containers {
        image = "gcr.io/cloudrun/hello"
        ports {
          container_port = 8443
        }
        dynamic "volume_mounts" {
          for_each = google_secret_manager_secret.secrets
          content {
            mount_path = "/secrets/${volume_mounts.value.secret_id}"
            name       = volume_mounts.value.secret_id
          }
        }
      }
      dynamic "volumes" {
        for_each = google_secret_manager_secret.secrets
        content {
          name = volumes.value.secret_id
          secret {
            secret_name = volumes.value.secret_id
            items {
              key  = "latest"
              path = volumes.value.secret_id
            }
          }
        }
      }
    }
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = 10
      }
    }
  }
}

resource "google_cloudbuild_trigger" "cloud-run-build-trigger" {
  depends_on = [
    google_cloud_run_service.cloud_run_service,
    google_project_service.cloudbuild_api
  ]
  project  = var.project_id
  name     = "cloud-run-build-trigger"
  description = "Trigger for Cloud Run service"
  location = var.region
  filename = "./cloudbuild.yaml"
  service_account = google_service_account.cloudbuild_service_account.id
  github {
    owner = var.github_name
    name = var.github_repo
    push {
      branch = "^test$"
    }
  }
}