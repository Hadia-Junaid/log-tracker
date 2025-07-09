/** @jsx h */
/** @jsxFrag Fragment */
import { h } from "preact";
import { Pin, PinOff } from "lucide-preact";
import axios from "../../../api/axios";
import type { PinnedApp } from "../types";
import type { AvailableApp } from "./usePinnedApp";

interface Props {
    app: PinnedApp | AvailableApp;
    isPinned: boolean;
    userId?: string;
    onRefresh: () => void;
}

const ManagePinsCard = ({ app, isPinned, userId, onRefresh }: Props) => {
    const handleToggle = async () => {
        if (!userId) return;
        try {
            const appId = app._id;
            if (isPinned) {
                await axios.delete(`/dashboard/pinned/${userId}/${appId}`);
            } else {
                await axios.patch(`/dashboard/pinned/${userId}/${appId}`);
            }
            await onRefresh?.();
        } catch (err) {
            console.error("Failed to toggle pin:", err);
        }
    };

    const name = isPinned ? (app as PinnedApp).appName : (app as AvailableApp).name;
    const environment = isPinned ? "" : (app as AvailableApp).environment;
    const description = isPinned ? "" : (app as AvailableApp).description;

    return (
        <div class="manage-pins-card oj-panel oj-sm-padding-2x oj-sm-margin-bottom-1x oj-flex oj-sm-justify-content-space-between">
            <div class="oj-typography-body-md oj-text-color-primary manage-pins-card-title">{name}</div>
            <oj-button chroming="outlined" display="all" onojAction={handleToggle}>
                {isPinned ? (
                    <>
                        <PinOff size={16} /> Unpin
                    </>
                ) : (
                    <>
                        <Pin size={16} /> Pin
                    </>
                )}
            </oj-button>
        </div>
    );
};

export default ManagePinsCard;
