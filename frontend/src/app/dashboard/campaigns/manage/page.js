import dynamicImport from "next/dynamic";

const ManageClient = dynamicImport(() => import("./ManageClient"), {
  ssr: false,
});

export default function Page() {
  return <ManageClient />;
}