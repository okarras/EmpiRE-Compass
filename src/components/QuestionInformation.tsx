import { Divider } from "@mui/material";

interface Props {
  information?: string;
  label: string;
}

const QuestionInformation = (props: Props) => {
  const { information, label } = props;
  return (
    <>
      {information ? (
        <>
          <h4 style={{ margin: '5px 0' }}>{label}</h4>
          <p style={{ marginBottom: 10 }}>{information}</p>
          <Divider />
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default QuestionInformation;
