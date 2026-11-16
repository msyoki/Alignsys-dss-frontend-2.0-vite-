import React, { useEffect, useState } from 'react';
import alignsysLogo from '../../images/ZFBLU.webp';

// Organisation logo with the Alignsys logo as the fallback, both when no logo
// was uploaded (src is empty) and when the uploaded file fails to load.
const BrandLogo = ({ src, fallback = alignsysLogo, alt = 'Organization logo', ...rest }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);

  return (
    <img
      src={!src || failed ? fallback : src}
      alt={alt}
      onError={() => { if (src && !failed) setFailed(true); }}
      {...rest}
    />
  );
};

export default BrandLogo;
