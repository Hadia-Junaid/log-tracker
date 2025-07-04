import { h } from 'preact';

type Props = {
  path?: string; // required by preact-router
};

export default function UserManagement(props: Props) {
  return <h1>User Management Page</h1>;
}
