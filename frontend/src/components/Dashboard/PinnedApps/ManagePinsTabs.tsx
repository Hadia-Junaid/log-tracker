/** @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";
import PinnedAppList from "./PinnedAppList";
import type { PinnedApp } from "../types";
import type { AvailableApp } from "./usePinnedApp";

interface Props {
    pinnedApps: PinnedApp[];
    availableApps: AvailableApp[];
    loading: boolean;
    onRefresh: () => void;
    userId?: string;
}

const ManagePinsTabs = ({ pinnedApps, availableApps, loading, onRefresh, userId }: Props) => {
    const [tab, setTab] = useState<"pinned" | "available">("pinned");
    const [search, setSearch] = useState("");

    const filteredPinned = pinnedApps.filter(app =>
        app.appName.toLowerCase().includes(search.toLowerCase())
    );

    const filteredAvailable = availableApps.filter(app =>
        app.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div class="manage-pins-container">
            <oj-input-text
                value={search}
                onvalueChanged={(e) => setSearch(e.detail?.value || "")}
                class="manage-pins-search"
                placeholder="Search applications..."
            />

            <div class="manage-pins-tabs oj-flex oj-sm-gap-1x oj-sm-margin-bottom-2x">
                <oj-button
                    onojAction={() => setTab("pinned")}
                    chroming={tab === "pinned" ? "solid" : "outlined"}
                >
                    Pinned
                </oj-button>
                <oj-button
                    onojAction={() => setTab("available")}
                    chroming={tab === "available" ? "solid" : "outlined"}
                >
                    Available
                </oj-button>
            </div>

            <PinnedAppList
                apps={tab === "pinned" ? filteredPinned : filteredAvailable}
                isPinned={tab === "pinned"}
                userId={userId}
                onRefresh={() => {onRefresh?.();}}
                loading={loading}
            />

            {!loading && (tab === "pinned" ? filteredPinned.length === 0 : filteredAvailable.length === 0) && (
                <div class="oj-text-color-secondary">No {tab} applications</div>
            )
            }
        </div>
    );
};

export default ManagePinsTabs;
