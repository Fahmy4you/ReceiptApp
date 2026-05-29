import PageLayoutCreateClient from "@/client/PageLayoutCreateClient";
import { ReceiptElement } from "@/lib/types";
import { getLayoutById } from "@/models/Layout";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>; 
}

const page = async ({ params }: PageProps) => {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const layout = await getLayoutById(id);
  if (!layout) {
    notFound();
  }

  return (
    <PageLayoutCreateClient name={layout.name} config={layout.config as unknown as ReceiptElement[]} idLayout={layout.id} />
  );
};

export default page;