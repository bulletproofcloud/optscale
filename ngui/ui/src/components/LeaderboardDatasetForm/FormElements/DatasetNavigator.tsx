import { useMemo } from "react";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { useFormContext } from "react-hook-form";
import { useIntl } from "react-intl";
import Table from "components/Table";
import TableCellActions from "components/TableCellActions";
import TableLoader from "components/TableLoader";
import { isEmpty } from "utils/arrays";
import { datasetTimespan, leaderboardCriteriaDataset, leaderboardCriteriaDatasetLabels } from "utils/columns";
import { EN_FULL_FORMAT, format, secondsToMilliseconds } from "utils/datetime";
import { FIELD_NAMES } from "../constants";

const DatasetNavigator = ({ datasets, isLoading = false }) => {
  const intl = useIntl();

  const { setValue, watch } = useFormContext();
  const selectedDatasets = watch(FIELD_NAMES.SELECTED_DATASETS);

  const getRangeFilterDefinition = () => {
    const fromTimeSpans = datasets.map((dataset) => dataset.timespan_from).filter(Boolean);

    const toTimeSpans = datasets.map((dataset) => dataset.timespan_to).filter(Boolean);

    if (isEmpty(fromTimeSpans) || isEmpty(toTimeSpans)) {
      return undefined;
    }

    const minTimespan = Math.min(...fromTimeSpans);
    const maxTimespan = Math.max(...toTimeSpans);

    return {
      min: minTimespan,
      max: maxTimespan,
      step: 1,
      filterFn: (originalRow, range) => {
        const { timespan_from: timespanFrom, timespan_to: timespanTo } = originalRow;

        if (!timespanFrom && !timespanTo) {
          return true;
        }

        if (timespanFrom && !timespanTo) {
          return timespanFrom >= range[0] && timespanFrom <= range[1];
        }

        if (timespanTo && !timespanFrom) {
          return timespanTo >= range[0] && timespanTo <= range[1];
        }

        return range[1] >= timespanFrom && timespanTo >= range[0];
      },
      title: (range) =>
        intl.formatMessage(
          { id: "timerange" },
          {
            from: format(secondsToMilliseconds(range[0]), EN_FULL_FORMAT),
            to: format(secondsToMilliseconds(range[1]), EN_FULL_FORMAT)
          }
        )
    };
  };

  const tableData = useMemo(() => {
    const selectedDatasetIds = selectedDatasets.map(({ id }) => id);

    return datasets.filter(({ id }) => !selectedDatasetIds.includes(id)).map((dataset) => dataset);
  }, [datasets, selectedDatasets]);

  const columns = useMemo(
    () => [
      {
        header: null,
        enableSorting: false,
        id: "actions",
        cell: ({ row: { original } }) => (
          <TableCellActions
            items={[
              {
                key: "add",
                messageId: "add",
                icon: <AddOutlinedIcon fontSize="small" />,
                action: () => {
                  setValue(FIELD_NAMES.SELECTED_DATASETS, [...selectedDatasets, original]);
                }
              }
            ]}
          />
        )
      },
      leaderboardCriteriaDataset({
        nameAccessor: "name",
        pathAccessor: "path",
        deletedAccessor: "deleted"
      }),
      leaderboardCriteriaDatasetLabels(),
      datasetTimespan()
    ],
    [selectedDatasets, setValue]
  );

  return isLoading ? (
    <TableLoader />
  ) : (
    <Table
      data={tableData}
      columns={columns}
      withSearch
      pageSize={5}
      enableSearchQueryParam={false}
      enablePaginationQueryParam={false}
      localization={{
        emptyMessageId: "noDatasets"
      }}
      rangeFilter={getRangeFilterDefinition()}
    />
  );
};

export default DatasetNavigator;
