import * as core from "@actions/core";
import CloudWatch from "aws-sdk/clients/cloudwatch";
import { run } from "../src/cw-build-status";

jest.mock("aws-sdk/clients/cloudwatch");

describe("unit test suite", () => {
	test("Ensure that CloudWatch.putMetricData is called", async () => {
		jest.spyOn(core, "getInput").mockImplementation((inputName) => {
			switch (inputName) {
				case "namespace":
					return "ns";
				case "metric-name":
					return "abcd";
				case "metric-value":
					return "1.0";
				case "metric-dimensions":
					return "[]";
			}
			throw new Error("unknown input");
		});
		CloudWatch.prototype.putMetricData = jest
			.fn()
			.mockImplementationOnce(() => {
				return {
					promise() {
						return Promise.resolve({
							data: "success",
						});
					},
				};
			});
		run();
		expect(CloudWatch.prototype.putMetricData).toBeCalled();
	});
});
