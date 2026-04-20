import { useSearchParams } from "react-router-dom";

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export default function usePaginationQuery(defaultPage = 1, defaultLimit = 10) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePositiveInt(searchParams.get("page"), defaultPage);
  const limit = parsePositiveInt(searchParams.get("limit"), defaultLimit);

  const setPage = (newPage) => {
    const nextPage = parsePositiveInt(String(newPage), defaultPage);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", String(nextPage));
      return params;
    });
  };

  const setLimit = (newLimit) => {
    const nextLimit = parsePositiveInt(String(newLimit), defaultLimit);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("limit", String(nextLimit));
      params.set("page", "1");
      return params;
    });
  };

  return { page, limit, setPage, setLimit };
}
