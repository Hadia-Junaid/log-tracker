// src/components/applications/EditApplicationDialog.tsx
import { h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import "ojs/ojdialog";
import "ojs/ojinputtext";
import "ojs/ojformlayout";
import "ojs/ojbutton";
import "ojs/ojlabel";
import "ojs/ojprogress-circle";
import axios from "../../api/axios";
import "../../styles/applications/addApplicationDialog.css";
import { Application } from "../../types/applications";
import { isAxiosError } from "../../api/axios";

type EditApplicationDialogProps = {
  isOpen: boolean;
  application: Application | null;
  onClose: () => void;
  onApplicationUpdated: (updatedApp: Application) => void;
};

const environments = ["Development", "Testing", "Staging", "Production"];

export default function EditApplicationDialog({
  isOpen,
  application,
  onClose,
  onApplicationUpdated,
}: EditApplicationDialogProps) {
  const dialogRef = useRef<any>(null);
  const [name, setName] = useState("");
  const [hostname, setHostname] = useState("");
  const [environment, setEnvironment] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (dialogRef.current) {
      if (isOpen && application) {
        dialogRef.current.open();
        setName(application.name || "");
        setHostname(application.hostname || "");
        setEnvironment(application.environment || "");
        setDescription(application.description || "");
        setIsActive(application.isActive);
        setLoading(false);
        setError(null);
        setSuccessMessage(null);
      } else {
        dialogRef.current.close();
      }
    }
  }, [isOpen, application]);

  const handleOjDialogClose = (event: CustomEvent) => {
    if (event.detail.originalEvent) {
      onClose();
    }
  };

  const validate = () => {
    if (name.trim().length < 5 || name.length > 20)
      return "Name must be 5–20 characters.";
    if (!hostname.trim() || hostname.length > 255)
      return "Hostname is required and must be less than 255 characters.";
    if (!environments.includes(environment))
      return "Please select a valid environment.";
    if (description && (description.length < 10 || description.length > 100))
      return "Description must be 10–100 characters or left blank.";
    return null;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!application) return;

    setLoading(true);
    try {
      const updatedApp = {
        name,
        hostname,
        environment,
        description,
        isActive,
      };

      console.log("Updating application:", updatedApp);

      const response = await axios.patch(
        `/applications/${application._id}`,
        updatedApp
      );
      setSuccessMessage("Application updated successfully!");
      console.log("Updated application:", response.data);
      onApplicationUpdated(response.data);
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error(err);
      // If status is 409, show name already exists error
      if (isAxiosError(err) && err.response?.status === 409) {
        setError("An application with this name already exists. Please choose a different name.");
        return;
      }
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <oj-dialog
      ref={dialogRef}
      id="editApplicationDialog"
      dialogTitle="Edit Application"
      onojClose={handleOjDialogClose}
    >
      <div class="oj-dialog-body">
        {loading && (
          <div class="loading-overlay">
            <oj-progress-circle
              value={-1}
              class="loading-spinner"
            ></oj-progress-circle>
            <p>Saving changes...</p>
          </div>
        )}
        {error && <p class="error-message">{error}</p>}
        {successMessage && <p class="success-message">{successMessage}</p>}

        <form onSubmit={handleSubmit} class="add-application-form">
          <oj-form-layout labelEdge="start">
            <oj-label for="editAppName">Application Name</oj-label>
            <oj-input-text
              id="editAppName"
              value={name}
              onvalueChanged={(e: CustomEvent) => setName(e.detail.value)}
              required
              disabled={loading}
            ></oj-input-text>

            <oj-label for="editAppHostname">Hostname</oj-label>
            <oj-input-text
              id="editAppHostname"
              value={hostname}
              onvalueChanged={(e: CustomEvent) => setHostname(e.detail.value)}
              required
              disabled={loading}
            ></oj-input-text>

            <oj-label for="editAppEnvironment">Environment</oj-label>
            <select
              id="editAppEnvironment"
              value={environment}
              onChange={(e: Event) =>
                setEnvironment((e.target as HTMLSelectElement).value)
              }
              disabled={loading}
              class="oj-form-control select-native"
              required
            >
              <option value="" disabled>
                Select Environment
              </option>
              {environments.map((env) => (
                <option key={env} value={env}>
                  {env}
                </option>
              ))}
            </select>

            <oj-label for="editAppDescription">Description</oj-label>
            <oj-input-text
              id="editAppDescription"
              value={description}
              onvalueChanged={(e: CustomEvent) =>
                setDescription(e.detail.value)
              }
              disabled={loading}
            ></oj-input-text>

            <oj-label for="editAppIsActive">Status</oj-label>
            <div class="oj-form-control-wrapper">
              <oj-switch
                id="editAppIsActive"
                value={isActive}
                onvalueChanged={(e: CustomEvent) => setIsActive(e.detail.value)}
                disabled={loading}
                aria-label="Status"
                class="oj-form-control"
              ></oj-switch>
            </div>
          </oj-form-layout>

          <div class="oj-flex oj-sm-justify-content-end oj-sm-margin-2x-top">
            <oj-button
              chroming="outlined"
              onojAction={onClose}
              disabled={loading}
              class="cancel-button"
            >
              Cancel
            </oj-button>
            <oj-button
              chroming="solid"
              type="submit"
              disabled={loading}
              class="submit-button"
            >
              Save Changes
            </oj-button>
          </div>
        </form>
      </div>
    </oj-dialog>
  );
}
