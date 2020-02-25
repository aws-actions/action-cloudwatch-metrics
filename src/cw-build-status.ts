import * as core from '@actions/core'
import * as github from '@actions/github'
import CloudWatch from 'aws-sdk/clients/cloudwatch'

const cloudwatch = new CloudWatch()
const context = github.context

const EVENT_NAME_DIMENSION = 'EventName'
const FAILED_BUILD_STATUS = 'failure'
const FAILED_BUILDS_METRIC_NAME = 'FailedBuilds'
const FAILED_METRIC_VALUE = 0.0
const IS_CRON_JOB_DIMENSION = 'IsCronJob'
const NUM_BUILDS_METRIC_NAME = 'Builds'
const PROJECT_DIMENSION = 'ProjectName'
const REPOSITORY_DIMENSION = 'Repository'
const REFERENCE_DIMENSION = 'Reference'
const SCHEDULE_EVENT_NAME = 'schedule'
const SUCCESS_BUILDS_METRIC_NAME = 'SucceededBuilds'
const SUCCESS_METRIC_VALUE = 1.0
const WORKFLOW_DIMENSION = 'Workflow'

/**
 * Validate the `status` input to the action.
 * 
 * @param status The input string from the workflow
 */
export function checkStatusString(status: string) {
  const validBuildStatusCheck = new RegExp('(success|failure)')
  if (!status.match(validBuildStatusCheck)) {
    throw new Error(`Invalid build status ${status} passed to cw-build-status`)
  }
}

/**
 * Construct a CloudWatch metric datum with repo and workflow info.
 * 
 * @param metricName The name of the CloudWatch Metric
 * @param projectName The name of the GitHub repo
 * @param isCronJob True if the workflow is a scheduled run. False otherwise.
 * @param value The value of the metric (1.0 or 0.0)
 */
export function createMetricDatum(metricName: string, projectName: string, isCronJob: Boolean, value: number) {
  const cronJobString = isCronJob ? 'True' : 'False'
  const metric_datum = {
    'MetricName': metricName,
    'Value': value, 
    'Dimensions': [
      { 'Name': EVENT_NAME_DIMENSION, 'Value': context.eventName },
      { 'Name': IS_CRON_JOB_DIMENSION, 'Value': cronJobString },
      { 'Name': PROJECT_DIMENSION, 'Value': projectName },
      { 'Name': REFERENCE_DIMENSION, 'Value': context.ref },
      { 'Name': REPOSITORY_DIMENSION, 'Value': context.repo.repo },
      { 'Name': WORKFLOW_DIMENSION, 'Value': context.workflow },
    ]
  }
  return metric_datum
}

/**
 * Publish datapoints using the AWS CloudWatch Metrics SDK.
 * 
 * @param metricData A list of CloudWatch metric datapoints (objects)
 */
export async function publishMetricData(metricNamespace, metricData) {
  try {
    core.info(`Publishing metrics ${JSON.stringify(metricData, null, 2)} under namespace ${metricNamespace}`)
    await cloudwatch.putMetricData({
      Namespace: metricNamespace,
      MetricData: metricData
    }).promise()
  } catch (error) {
    core.error('Failed to publish metric data')
    core.setFailed(error.message)
  }
}

/**
 * Parse parameters from input, populate the metrics, and publish them to CloudWatch.
 */
export async function postBuildStatus() {
  try {
    // Get all parameters
    const metricNamespace = core.getInput('namespace')
    const projectName = core.getInput('project-name')
    const buildStatus = core.getInput('status', { required: true })
    checkStatusString(buildStatus)
    const isFailedBuild: Boolean = buildStatus === FAILED_BUILD_STATUS
    const isCronJob: Boolean = context.eventName === SCHEDULE_EVENT_NAME

    // Populate the datapoints
    let metricData = new Array
    metricData.push(
      createMetricDatum(
        NUM_BUILDS_METRIC_NAME,
        projectName,
        isCronJob,
        SUCCESS_METRIC_VALUE))
    metricData.push(
      createMetricDatum(
        FAILED_BUILDS_METRIC_NAME,
        projectName,
        isCronJob,
        isFailedBuild ? SUCCESS_METRIC_VALUE : FAILED_METRIC_VALUE))
    metricData.push(
      createMetricDatum(
        SUCCESS_BUILDS_METRIC_NAME,
        projectName,
        isCronJob,
        isFailedBuild ? FAILED_METRIC_VALUE : SUCCESS_METRIC_VALUE))

    // Log to CloudWatch
    await publishMetricData(metricNamespace, metricData)
    core.info('Successfully published metrics')
  } catch (error) {
    core.setFailed(error.message)
  }
}

async function run() {
  await postBuildStatus()
}

run()
