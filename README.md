# Amazon CloudWatch Metrics Github Action

[![GitHub Action Status](https://github.com/ros-tooling/action-cloudwatch-metrics/workflows/Test%20action-cloudwatch-metrics/badge.svg)](https://github.com/ros-tooling/action-cloudwatch-metrics)
[![codecov](https://codecov.io/gh/ros-tooling/action-cloudwatch-metrics/branch/master/graph/badge.svg)](https://codecov.io/gh/ros-tooling/action-cloudwatch-metrics)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=ros-tooling/action-cloudwatch-metrics)](https://dependabot.com)

This action publishes a single metric to [Amazon CloudWatch][amazon-cloudwatch].

You can use this action to report workflow metrics, such as completed builds,
build failures, build times, or any other metric.

Using Amazon CloudWatch, you can then setup a unified dashboard to monitor
all your packages, and be alerted when builds fail.

To access AWS from a GitHub Action workflow, consider using
[configure-aws-credentials]. This action simplifies setting AWS credentials
correctly.

## Example Workflow

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    name: 'Build'
    steps:
    - name: Checkout repo
      uses: actions/checkout@v2
    - name: Build
      run: ./my-build-script.sh

    # Make sure the secrets are stored in you repo settings
    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
      if: always()  # Setup credentials even if the workflow failed
    - name: Log Build
      # replace TAG by the latest tag in the repository
      uses: ros-tooling/action-cloudwatch-metrics@TAG
      if: always()  # Need to run to log the workflow failure
```

## CloudWatch Metrics format

By default, the action will push a metrics named 'Builds', with a value of 1
if the build succeeds, or 0 otherwise. The metrics dimensions are:
`github.event_name`, `github.ref`, `github.repository`, `github.workflow`.

See [GitHub actions context documentation][github-context] for details about
those values.

## Inputs

### `metric-dimensions`

The dimensions of the metric.

Defaults to:

```JSON
    [
      { "Name": "github.event_name", "Value": "${{ github.event_name }}" },
      { "Name": "github.ref", "Value": "${{ github.ref }}" },
      { "Name": "github.repository", "Value": "${{ github.repository }}" }
    ]
```

### `metric-name`

The name of the metric.
Defaults to `Builds`.

### `metric-value`

The value for the metric.
Defaults to `${{ job.status }} == 'success'`.

`true` and `false` are respectfully transformed to 1.0, and 0.0, in order
to enable boolean values to be passed as metrics.

### `namespace`

The namespace for the metric data.
Defaults to `ActionCloudWatchMetrics`.

To avoid conflicts with AWS service namespaces, you should not specify a
namespace that begins with `AWS/`.

[amazon-cloudwatch]: https://docs.aws.amazon.com/cloudwatch/index.html
[github-context]: https://help.github.com/en/actions/automating-your-workflow-with-github-actions/contexts-and-expression-syntax-for-github-actions#github-context
[configure-aws-credentials]: https://github.com/aws-actions/configure-aws-credentials
[check-run-event-doc]: https://developer.github.com/v3/activity/events/types/#checkrunevent
