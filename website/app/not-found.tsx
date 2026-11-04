import { DefaultNotFound } from "fumadocs-ui/layouts/home/not-found";
import { TypedocRedirect } from "@/components/typedoc-redirect";

export default function NotFound() {
  return (
    <>
      <TypedocRedirect />
      <DefaultNotFound />
    </>
  );
}
