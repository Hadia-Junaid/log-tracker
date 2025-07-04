import { h } from 'preact';

type Props = {
  path?: string; // required by preact-router
};

export default function Dashboard(props: Props) {
  return <h1>Dashboard Page</h1>;
}
