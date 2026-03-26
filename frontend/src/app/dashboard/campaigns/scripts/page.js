import dynamicImport from "next/dynamic";

const ScriptsClient = dynamicImport(() => import("./ScriptsClient"), {
  ssr: false,
});

export default function Page() {
  return <ScriptsClient />;
}