import { h } from 'preact';

type Props = {
  path?: string; // required by preact-router
};

export default function Logs(props: Props) {
  return <h1>Logs Page</h1>;
}
