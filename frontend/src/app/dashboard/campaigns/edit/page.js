import dynamic from "next/dynamic";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EditClient = dynamic(() => import("./EditClient"), {
  ssr: false,
});

export default function Page() {
  return <EditClient />;
}