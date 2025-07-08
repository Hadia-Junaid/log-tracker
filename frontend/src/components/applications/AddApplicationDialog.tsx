// src/components/applications/AddApplicationDialog.tsx
import { h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import "ojs/ojdialog";
import "ojs/ojinputtext";
import "ojs/ojformlayout";
import "ojs/ojbutton";
import "ojs/ojlabel";
import "ojs/ojprogress-circle";
import axios from "../../api/axios";
import { isAxiosError } from "../../api/axios";
import "../../styles/applications/addApplicationDialog.css";
import { Application } from "../../types/applications";
import "ojs/ojswitch";
import { UserGroup } from "../../types/applications";

type AddApplicationDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onApplicationAdded: (newApp: Application) => void;
};

const environments = ["Development", "Testing", "Staging", "Production"];

export default function AddApplicationDialog({
  isOpen,
  onClose,
  onApplicationAdded,
}: AddApplicationDialogProps) {
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
      if (isOpen) {
        dialogRef.current.open();
        setName("");
        setHostname("");
        setEnvironment("");
        setDescription("");
        setLoading(false);
        setError(null);
        setSuccessMessage(null);

        axios
          .get("/user-groups")
          .then((res) => {
            console.log("Fetched user groups:", res.data);
            setUserGroups(res.data);
          })
          .catch((err) => {
            console.error("Failed to fetch user groups", err);
            setError("Failed to load user groups.");
          });
      } else {
        dialogRef.current.close();
      }
    }
  }, [isOpen]);

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

    setLoading(true);
    try {
      const newApp = {
        name,
        hostname,
        environment,
        description,
        isActive,
        userGroups: selectedGroups,
      };
      console.log("New application data:", newApp);

      const response = await axios.post("/applications", newApp);
      setSuccessMessage("Application added successfully!");
      onApplicationAdded(response.data);
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error(err);

      //if status is 409, show name already exists error
      if (isAxiosError(err) && err.response?.status === 409) {
        setError(
          "An application with this name already exists. Please choose a different name."
        );
        return;
      }

      setError("Failed to add application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <oj-dialog
      ref={dialogRef}
      id="addApplicationDialog"
      dialogTitle="Add New Application"
      onojClose={handleOjDialogClose}
    >
      <div class="oj-dialog-body">
        {loading && (
          <div class="loading-overlay">
            <oj-progress-circle
              value={-1}
              class="loading-spinner"
            ></oj-progress-circle>
            <p>Adding application...</p>
          </div>
        )}
        {error && <p class="error-message">{error}</p>}
        {successMessage && <p class="success-message">{successMessage}</p>}

        <form onSubmit={handleSubmit} class="add-application-form">
          <oj-form-layout labelEdge="start">
            <oj-label for="appName">Application Name</oj-label>
            <oj-input-text
              id="appName"
              value={name}
              onvalueChanged={(e: CustomEvent) => setName(e.detail.value)}
              required
              disabled={loading}
            ></oj-input-text>

            <oj-label for="appHostname">Hostname</oj-label>
            <oj-input-text
              id="appHostname"
              value={hostname}
              onvalueChanged={(e: CustomEvent) => setHostname(e.detail.value)}
              required
              disabled={loading}
            ></oj-input-text>

            <oj-label for="appEnvironment">Environment</oj-label>
            <select
              id="appEnvironment"
              value={environment}
              onChange={(e: Event) =>
                setEnvironment((e.target as HTMLSelectElement).value)
              }
              disabled={loading}
              class="oj-form-control select-native"
              required
            >
              <option value="" disabled selected>
                Select Environment
              </option>
              {environments.map((env) => (
                <option key={env} value={env}>
                  {env}
                </option>
              ))}
            </select>

            <oj-label for="appDescription">Description</oj-label>
            <oj-input-text
              id="appDescription"
              value={description}
              onvalueChanged={(e: CustomEvent) =>
                setDescription(e.detail.value)
              }
              disabled={loading}
            ></oj-input-text>

            <oj-label for="appIsActive">Status</oj-label>
            <div class="oj-form-control-wrapper">
              <oj-switch
                id="appIsActive"
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
                      checked={selectedGroups.includes(group._id) || group.is_admin}
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
              Add Application
            </oj-button>
          </div>
        </form>
      </div>
    </oj-dialog>
  );
}
