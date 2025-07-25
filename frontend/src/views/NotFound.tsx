type NotFoundProps = {
  default?: boolean;
};

const NotFound = (_props: NotFoundProps) => {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>404 - Not Found</h2>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
};

export default NotFound;