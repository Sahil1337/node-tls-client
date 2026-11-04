import defaultMdxComponents from "fumadocs-ui/mdx";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import type { MDXComponents } from "mdx/types";
import { BenchBars, BenchStats, ThroughputChart } from "./benchmarks";
import { Callout } from "./callout";
import { PropTable } from "./prop-table";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    BenchBars,
    BenchStats,
    Callout,
    PropTable,
    Step,
    Steps,
    Tab,
    Tabs,
    ThroughputChart,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
