import dynamicImport from "next/dynamic";

const EditClient = dynamicImport(() => import("./EditClient"), {
  ssr: false,
});

export default function Page() {
  return <EditClient />;
}