import { h } from "preact";
import "ojs/ojprogress-circle";

import "../styles/loading-spinner.css";

export default function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div class="loading-spinner-container">
      <oj-progress-circle value={-1} size="lg" />
      {message && <p class="loading-spinner-message">{message}</p>}
    </div>
  );
}
