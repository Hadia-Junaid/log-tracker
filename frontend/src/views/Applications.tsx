import { h } from 'preact';

type Props = {
  path?: string; // required by preact-router
};

export default function Applications(props: Props) {
  return <h1>Applications Page</h1>;
}
