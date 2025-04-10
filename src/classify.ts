import { type Label } from "@aws-sdk/client-rekognition";

export const classifyLabels = (
  labels: Label[]
):
  | {
      name: string;
      category: string;
      confidence: number;
    }
  | undefined => {
  if (!labels.length) return undefined;

  // Filter for labels with a minimum of 99%
  const highPercentageItem = labels.find(
    (label) => !!(label?.Confidence && label.Confidence >= 99)
  );

  if (highPercentageItem) {
    const category = !!(
      highPercentageItem?.Categories && !!highPercentageItem.Categories.length
    )
      ? `${highPercentageItem.Categories[0].Name}`
      : "";

    return {
      name: highPercentageItem.Name || "",
      category,
      confidence: highPercentageItem?.Confidence
        ? Math.floor(highPercentageItem.Confidence)
        : 0,
    };
  }

  // 2nd Check for instances
  const instance = labels.find(
    (label) => !!(label.Instances && !!label.Instances?.length)
  );

  if (instance) {
    const category = !!(instance?.Categories && !!instance.Categories.length)
      ? `${instance.Categories[0].Name}`
      : "";

    return {
      name: instance.Name || "",
      category,
      confidence: instance?.Confidence ? Math.floor(instance.Confidence) : 0,
    };
  }

  // Default Return 1st Label
  const item = labels[0];

  const category = !!(item?.Categories && !!item.Categories.length)
    ? `${item.Categories[0].Name}`
    : "";

  return {
    name: item.Name || "",
    category,
    confidence: item?.Confidence ? Math.floor(item.Confidence) : 0,
  };
};
