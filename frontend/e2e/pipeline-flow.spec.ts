import { test, expect, type Page } from "@playwright/test";
import { cleanDatabase } from "./cleanup";
import { loginViaUi } from "./auth-helper";

test.describe("Pipeline Flow: Translate + Summarize", () => {
  test.beforeEach(async ({ page }) => {
    await cleanDatabase();
    await loginViaUi(page);
  });

  test("create templates, build pipeline, execute, and verify result", async ({
    page,
  }) => {
    test.slow();
    await createTemplate(page, {
      name: "Translate to English",
      description: "Translates any text to English",
      content:
        "Translate the following text to English. Only output the translation, nothing else.\n\n{{text}}",
    });

    await createTemplate(page, {
      name: "Summarize",
      description: "Summarizes text in 1-2 sentences",
      content:
        "Summarize the following text in 1-2 sentences. Be concise and capture the key point.\n\n{{english_text}}",
    });

    await createPipeline(page, {
      name: "Translate and Summarize",
      description: "Translates text to English then summarizes it",
      steps: [
        {
          template: "Translate to English",
          provider: "anthropic",
          outputVariable: "english_text",
        },
        {
          template: "Summarize",
          provider: "anthropic",
          outputVariable: "summary",
        },
      ],
    });

    await executePipeline(page, {
      pipelineName: "Translate and Summarize",
      variables: { text: "Bonjour le monde, ceci est un test." },
    });

    await verifyExecutionInHistory(page);
  });
});

interface TemplateInput {
  name: string;
  description: string;
  content: string;
}

async function createTemplate(page: Page, template: TemplateInput) {
  await page.goto("/");
  await page.getByRole("link", { name: "Templates" }).click();
  await page.getByRole("button", { name: "New Template" }).click();

  await page.getByLabel("Name").fill(template.name);
  await page.getByLabel("Description").fill(template.description);
  await page.getByLabel("Content").fill(template.content);
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText(template.name).first()).toBeVisible();
}

interface PipelineStep {
  template: string;
  provider: string;
  outputVariable: string;
}

interface PipelineInput {
  name: string;
  description: string;
  steps: PipelineStep[];
}

async function createPipeline(page: Page, pipeline: PipelineInput) {
  await page.goto("/");
  await page.getByRole("link", { name: "Pipelines" }).click();
  await page.getByRole("button", { name: "New Pipeline" }).click();

  await page.getByLabel("Name").fill(pipeline.name);
  await page.getByLabel("Description").fill(pipeline.description);

  for (let i = 0; i < pipeline.steps.length; i++) {
    if (i > 0) {
      await page.getByText("+ Add Step").click();
    }

    const step = pipeline.steps[i];
    const stepCard = page
      .getByText(`Step ${i + 1}`, { exact: false })
      .locator("../..");

    const selects = stepCard.locator("select");

    await selects.nth(0).selectOption({ label: step.template });

    await stepCard.locator('input[type="text"]').fill(step.outputVariable);

    await selects.nth(1).selectOption(step.provider);

    await selects.nth(2).selectOption({ index: 1 });
  }

  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText(pipeline.name).first()).toBeVisible();
}

interface ExecutionInput {
  pipelineName: string;
  variables: Record<string, string>;
}

async function executePipeline(page: Page, input: ExecutionInput) {
  const pipelineCard = page.getByText(input.pipelineName).locator("../..");
  await pipelineCard.getByRole("button", { name: "Execute" }).click();

  await expect(
    page.getByText(`Execute: ${input.pipelineName}`),
  ).toBeVisible();

  for (const [name, value] of Object.entries(input.variables)) {
    await page.getByLabel(name).fill(value);
  }

  await page.getByRole("button", { name: "Execute" }).click();

  await expect(page.getByText("Results")).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("Step 1")).toBeVisible();
  await expect(page.getByText("Step 2")).toBeVisible();
  await expect(page.getByText("completed").first()).toBeVisible();
}

async function verifyExecutionInHistory(page: Page) {
  await page.getByRole("link", { name: "Executions" }).click();

  await page.getByRole("button", { name: "Pipeline Executions" }).click();

  await expect(
    page.getByText("Translate and Summarize").first(),
  ).toBeVisible();
  await expect(page.getByText("completed").first()).toBeVisible();
}
