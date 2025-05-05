import { Divider } from '@mui/material';

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
          <div
            dangerouslySetInnerHTML={{ __html: information }}
            style={{ marginBottom: 10 }}
          />
          <Divider />
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default QuestionInformation;
