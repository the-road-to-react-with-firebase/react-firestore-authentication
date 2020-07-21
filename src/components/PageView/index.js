import { useEffect } from "react";

const Page = (props) => {
  useEffect(() => {
    document.title = props.title || "";
  }, [props.title]);

  // Firebase page analytics
  useEffect(() => {
    props.firebase.analytics.logEvent('pageview', {
      page: props.title,
    });
  }, [props.firebase]);

  return props.children;
};

export default Page;