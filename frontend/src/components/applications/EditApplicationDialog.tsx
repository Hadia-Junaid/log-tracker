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
import { UserGroup } from "../../types/applications";

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

  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

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

        axios
          .get(`/applications/${application._id}/assigned-groups`)
          .then((res) => {
            console.log("Fetched user groups:", res.data);
            setUserGroups(res.data.allGroups);
            setSelectedGroups(res.data.assignedGroupIds);
          })
          .catch((err) => {
            console.error("Failed to fetch user groups", err);
            setError("Failed to load user groups.");
          });
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
    const nameTrimmed = name.trim();
    const hostnameTrimmed = hostname.trim();
    const descriptionTrimmed = description?.trim() ?? "";

    // Name validation
    if (nameTrimmed.length < 5 || nameTrimmed.length > 20) {
      return "Name must be between 5 and 20 characters.";
    }

    const namePattern = /^[a-zA-Z0-9 _-]+$/;
    if (!namePattern.test(nameTrimmed)) {
      return "Name can only contain letters, numbers, spaces, hyphens, and underscores.";
    }

    // Hostname validation
    if (!hostnameTrimmed || hostnameTrimmed.length > 255) {
      return "Hostname is required and must be less than 255 characters.";
    }

    // Environment validation
    if (!environments.includes(environment)) {
      return "Please select a valid environment.";
    }

    // Description validation (optional)
    if (descriptionTrimmed) {
      if (descriptionTrimmed.length < 10 || descriptionTrimmed.length > 100) {
        return "Description must be between 10 and 100 characters.";
      }

      const descriptionPattern = /^[a-zA-Z0-9 _\-\.,:;()[\]'""]*$/;
      if (!descriptionPattern.test(descriptionTrimmed)) {
        return "Description contains invalid characters.";
      }
    }

    return null; // No errors
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
        userGroups: selectedGroups,
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
        setError(
          "An application with this name already exists. Please choose a different name."
        );
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

            <oj-label>User Groups</oj-label>
            <div class="user-group-checklist">
              {userGroups.map((group) => {
                const isDisabled = loading || group.is_admin;
                return (
                  <label
                    key={group._id}
                    class={`user-group-item ${group.is_admin ? "disabled-group" : ""}`}
                  >
                    <input
                      type="checkbox"
                      value={group._id}
                      checked={selectedGroups.includes(group._id)}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked;
                        const groupId = e.currentTarget.value;
                        setSelectedGroups((prev) =>
                          checked
                            ? [...prev, groupId]
                            : prev.filter((id) => id !== groupId)
                        );
                      }}
                      disabled={isDisabled}
                    />
                    {group.name}
                  </label>
                );
              })}
            </div>
          </oj-form-layout>

          <div class="oj-flex oj-sm-justify-content-end oj-sm-margin-2x-top">
            <button
              type="button"
              class="oj-button cancel-button native-oj-button"
              onClick={onClose}
            >
              <div class="oj-button-label">
                <span class="oj-button-text">Cancel</span>
              </div>
            </button>

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
