import { h } from 'preact';

type Props = {
  path?: string; // required by preact-router
};

export default function Settings(props: Props) {
  return <h1>Settings Page</h1>;
}
