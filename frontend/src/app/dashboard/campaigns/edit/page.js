import dynamic from "next/dynamic";
export const dynamic = "force-dynamic";

const EditClient = dynamic(() => import("./EditClient"), {
  ssr: false,
});

export default function Page() {
  return <EditClient />;
}