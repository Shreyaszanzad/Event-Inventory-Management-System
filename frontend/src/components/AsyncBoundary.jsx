import React from 'react';
import { Spin, Result, Button, Empty, Card, Alert } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

/**
 * The loading / error / empty triple every wired page needs (YG-11).
 *
 * Error copy comes from `ApiError.message`, which is already the server's own
 * message — so a 400 like "Not enough seats available" reaches the user verbatim
 * instead of being flattened into "something went wrong".
 */

export const LoadingState = ({ tip = 'Loading…', minHeight = 260 }) => (
  <div
    style={{
      minHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}
  >
    <Spin size="large" tip={tip}>
      <div style={{ padding: '2rem 3rem' }} />
    </Spin>
  </div>
);

export const ErrorState = ({ error, onRetry, title }) => {
  const isOffline = error?.isNetwork;
  return (
    <Result
      status={isOffline ? 'warning' : 'error'}
      title={title || (isOffline ? 'Backend not reachable' : 'Something went wrong')}
      subTitle={error?.message || 'Please try again.'}
      extra={
        onRetry && (
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={onRetry}
            style={{ borderRadius: 12, fontWeight: 600 }}
          >
            Try again
          </Button>
        )
      }
      style={{ padding: '2rem 1rem' }}
    />
  );
};

export const EmptyState = ({ description = 'Nothing here yet.', action }) => (
  <Card style={{ borderRadius: 20, padding: '2.5rem 1rem', textAlign: 'center' }}>
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description}>
      {action}
    </Empty>
  </Card>
);

/**
 * Wraps a chunk of page in the three states.
 *
 * @param isEmpty  evaluated only once loading has finished and no error occurred.
 */
const AsyncBoundary = ({
  loading,
  error,
  onRetry,
  isEmpty = false,
  loadingTip,
  errorTitle,
  emptyDescription,
  emptyAction,
  children,
}) => {
  if (loading) return <LoadingState tip={loadingTip} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} title={errorTitle} />;
  if (isEmpty) return <EmptyState description={emptyDescription} action={emptyAction} />;
  return children;
};

/** Inline, non-blocking variant for errors on an action rather than a page load. */
export const InlineError = ({ error, onClose }) =>
  error ? (
    <Alert
      type="error"
      showIcon
      closable={Boolean(onClose)}
      onClose={onClose}
      message={error.message}
      style={{ borderRadius: 12, marginBottom: '1rem' }}
    />
  ) : null;

export default AsyncBoundary;
