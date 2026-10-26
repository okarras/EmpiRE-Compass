import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const HeaderExportAction = ({
  children,
  targetId = 'page-title-export-action',
}: {
  children: ReactNode;
  targetId?: string;
}) => {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById(targetId));
  }, [targetId]);

  return target ? createPortal(children, target) : <>{children}</>;
};

export default HeaderExportAction;
