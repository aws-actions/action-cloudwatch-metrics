import * as core from "@actions/core";
import CloudWatch from "aws-sdk/clients/cloudwatch";

/**
 * Parse parameters from input, populate the metrics, and publish them to CloudWatch.
 */
export async function run() {
	try {
		const namespace = core.getInput("namespace", { required: true });
		const metricName = core.getInput("metric-name", { required: true });
		const metricValue = core.getInput("metric-value", { required: true });
		let metricValueAsFloat = 0.0;
		switch (metricValue) {
			case "true":
				metricValueAsFloat = 1.0;
				break;
			case "false":
				metricValueAsFloat = 0.0;
				break;
			default:
				metricValueAsFloat = Number(metricValue);
		}
		const metricDimensions = core.getInput("metric-dimensions", {
			required: true,
		});
		const metricDatum = {
			MetricName: metricName,
			Value: metricValueAsFloat,
			Dimensions: JSON.parse(metricDimensions),
		};
		const metricData = [metricDatum];
		core.info(
			`Publishing metrics ${JSON.stringify(
				metricData,
				null,
				2
			)} under namespace ${namespace}`
		);
		const cloudwatch = new CloudWatch();
		await cloudwatch
			.putMetricData({
				Namespace: namespace,
				MetricData: metricData,
			})
			.promise();
		core.info("Successfully published metrics");
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();
