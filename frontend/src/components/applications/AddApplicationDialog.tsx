// src/components/applications/AddApplicationDialog.tsx
import { h } from "preact";
import { useState, useEffect, useRef, useMemo } from "preact/hooks";
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
import "ojs/ojselectsingle";
import ArrayDataProvider from "ojs/ojarraydataprovider";

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

  const [nameError, setNameError] = useState<string | null>(null);
  const [hostnameError, setHostnameError] = useState<string | null>(null);
  const [environmentError, setEnvironmentError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  const cancelDialogRef = useRef<any>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
        setSelectedGroups([]);
        setUserGroups([]);

        axios
          .get("/user-groups", {
            params: {
              is_active: true, // Only fetch active user groups
              allPages: true, // Fetch all pages
            },
          })
          .then((res) => {
            setUserGroups(res.data.data);
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

  useEffect(() => {
    const hasAnyError =
      nameError || hostnameError || environmentError || descriptionError;

    if (hasAnyError) {
      const timeout = setTimeout(() => {
        setNameError(null);
        setHostnameError(null);
        setEnvironmentError(null);
        setDescriptionError(null);
      }, 4000);

      return () => clearTimeout(timeout); // Clean up on re-render
    }
  }, [nameError, hostnameError, environmentError, descriptionError]);

  const handleOjDialogClose = (event: CustomEvent) => {
    if (event.detail.originalEvent) {
      onClose();
    }
  };

  const isDirty = useMemo(() => {
    return (
      name.trim() !== "" ||
      hostname.trim() !== "" ||
      environment !== "" ||
      description.trim() !== "" ||
      !isActive || // If default is true
      selectedGroups.length > 0
    );
  }, [name, hostname, environment, description, isActive, selectedGroups]);

  const handleCancelClick = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
      cancelDialogRef.current?.open();
    } else {
      onClose(); // close immediately if untouched
    }
  };

  const environmentOptions = [
    { value: "Production", label: "Production" },
    { value: "Staging", label: "Staging" },
    { value: "Development", label: "Development" },
    { value: "Testing", label: "Testing" },
  ];

  const environmentDataProvider = useMemo(() => {
    return new ArrayDataProvider(environmentOptions, {
      keyAttributes: "value",
    });
  }, []);

  const validate = () => {
    let valid = true;

    const nameTrimmed = name.trim();
    const hostnameTrimmed = hostname.trim();
    const descriptionTrimmed = description?.trim() ?? "";

    // Reset all errors first
    setNameError(null);
    setHostnameError(null);
    setEnvironmentError(null);
    setDescriptionError(null);

    // Name
    if (nameTrimmed.length < 5 || nameTrimmed.length > 20) {
      setNameError("Name must be between 5 and 20 characters.");
      valid = false;
    } else if (!/^[a-zA-Z0-9 _-]+$/.test(nameTrimmed)) {
      setNameError(
        "Name can only contain letters, numbers, spaces, hyphens, and underscores."
      );
      valid = false;
    }

    // Hostname
    if (!hostnameTrimmed || hostnameTrimmed.length > 255) {
      setHostnameError(
        "Hostname is required and must be less than 255 characters."
      );
      valid = false;
    }

    // Environment
    if (!environments.includes(environment)) {
      setEnvironmentError("Please select a valid environment.");
      valid = false;
    }

    // Description
    if (descriptionTrimmed.length < 10 || descriptionTrimmed.length > 100) {
      setDescriptionError("Description must be between 10 and 100 characters.");
      valid = false;
    } else if (!/^[a-zA-Z0-9 _\-\.,:;()[\]'""]*$/.test(descriptionTrimmed)) {
      setDescriptionError("Description contains invalid characters.");
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const isValid = validate();
    if (!isValid) {
      console.error("Validation failed");
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
      onojClose={handleOjDialogClose}
    >
      <div slot="header" class="custom-dialog-title">
        <h6>Add New Application</h6>

        {error && (
          <div style="color: red; font-size: 0.9em; margin-top: 4px;">
            {error}
          </div>
        )}

        {successMessage && !error && (
          <div style="color: green; font-size: 0.9em; margin-top: 4px;">
            {successMessage}
          </div>
        )}
      </div>

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

        <oj-dialog
          ref={cancelDialogRef}
          dialogTitle="Discard Changes?"
          cancelBehavior="none"
          onojClose={() => setShowCancelConfirm(false)}
          id="cancelConfirmationDialog"
        >
          <div class="oj-dialog-body">
            <p>Are you sure you want to discard your changes?</p>
          </div>
          <div slot="footer">
            <oj-button
              onojAction={() => {
                setShowCancelConfirm(false);
                cancelDialogRef.current?.close();
              }}
              disabled={loading}
            >
              Cancel
            </oj-button>
            <oj-button
              chroming="danger"
              onojAction={() => {
                cancelDialogRef.current?.close();
                setShowCancelConfirm(false);
                onClose();
              }}
              disabled={loading}
            >
              Confirm
            </oj-button>
          </div>
        </oj-dialog>

        <form onSubmit={handleSubmit} class="application-form">
          <oj-form-layout labelEdge="start">
            <div class="oj-form-item">
              <oj-label for="appName">Application Name</oj-label>
              <oj-input-text
                id="appName"
                value={name}
                onrawValueChanged={(e: CustomEvent) => setName(e.detail.value)}
                required
                disabled={loading}
              />
              {nameError && <p class="field-error">{nameError}</p>}
            </div>
            <div class="oj-form-item">
              <oj-label for="appHostname">Hostname</oj-label>
              <oj-input-text
                id="appHostname"
                value={hostname}
                onrawValueChanged={(e: CustomEvent) => setHostname(e.detail.value)}
                required
                disabled={loading}
              ></oj-input-text>
              {hostnameError && <p class="field-error">{hostnameError}</p>}
            </div>

            <div class="oj-form-item">
              <oj-label for="appEnvironment">Environment</oj-label>
              <oj-select-single
                id="appEnvironment"
                // label-hint="Select Environment"
                value={environment}
                onvalueChanged={(e: CustomEvent) => {
                  const selected = e.detail.value as string;
                  setEnvironment(selected);
                }}
                disabled={loading}
                required
                data={environmentDataProvider}
                placeholder="Select Environment"
              ></oj-select-single>

              {environmentError && (
                <p class="field-error">{environmentError}</p>
              )}
            </div>

            <div class="oj-form-item">
              <oj-label for="appDescription">Description</oj-label>
              <oj-input-text
                id="appDescription"
                value={description}
                onrawValueChanged={(e: CustomEvent) =>
                  setDescription(e.detail.value)
                }
                disabled={loading}
                required
              ></oj-input-text>
              {descriptionError && (
                <p class="field-error">{descriptionError}</p>
              )}
            </div>

            <div class="oj-form-item">
              <oj-label for="appIsActive">Status (Active/Inactive)</oj-label>
              <div class="switch-wrapper">
                <oj-switch
                  id="appIsActive"
                  value={isActive}
                  onvalueChanged={(e: CustomEvent) =>
                    setIsActive(e.detail.value)
                  }
                  disabled={loading}
                  aria-label="Status"
                />
              </div>
            </div>
            <div class="oj-form-item">
              <oj-label for="userGroups">User Groups</oj-label>
              <div id="userGroups" class="user-group-checklist">
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
                        checked={
                          selectedGroups.includes(group._id) || group.is_admin
                        }
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
            </div>
          </oj-form-layout>
          <div class="oj-flex oj-sm-justify-content-end oj-sm-margin-2x-top">
            <button
              type="button"
              class="oj-button cancel-button native-oj-button"
              onClick={handleCancelClick}
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
              Add Application
            </oj-button>
          </div>
        </form>
      </div>
    </oj-dialog>
  );
}
