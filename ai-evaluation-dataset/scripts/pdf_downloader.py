from typing import Optional
from pathlib import Path
import requests
from PyPDF2 import PdfReader

class PDFDownloader:
    def __init__(self, rate_limit: float = 1.0, max_retries: int = 3, 
                 timeout: int = 30, unpaywall_email: Optional[str] = None):
        self.rate_limit, self.max_retries, self.timeout = rate_limit, max_retries, timeout
        self.unpaywall_email, self.last_request_time = unpaywall_email, 0
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
    
    def _wait(self):
        elapsed = time.time() - self.last_request_time
        if elapsed < self.rate_limit:
            time.sleep(self.rate_limit - elapsed)
        self.last_request_time = time.time()
    
    def download_pdf(self, doi: str, output_path: str) -> bool:
        try:
            if not doi:
                return False
            pdf_url = self._resolve_url(doi)
            if not pdf_url:
                return False
            content = self._download(pdf_url)
            if not content or not content.startswith(b'%PDF-'):
                return False
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            Path(output_path).write_bytes(content)
            return self._validate(output_path)
        except:
            return False
    
    def _resolve_url(self, doi: str) -> Optional[str]:
        if '/' in doi:
            prefix = doi.split('/')[0]
            if prefix == '10.1109':
                return self._ieee_url(doi)
            elif prefix == '10.1007':
                return f"https://link.springer.com/content/pdf/{doi}.pdf"
            elif prefix == '10.1145':
                return f"https://dl.acm.org/doi/pdf/{doi}"
        if self.unpaywall_email:
            url = self._unpaywall_url(doi)
            if url:
                return url
        return self._doi_org_url(doi)
    
    def _ieee_url(self, doi: str) -> Optional[str]:
        try:
            self._wait()
            r = self.session.get(f"https://doi.org/{doi}", timeout=self.timeout, allow_redirects=True)
            if 'ieeexplore.ieee.org/document/' in r.url:
                article_num = r.url.split('/document/')[-1].split('/')[0].split('?')[0]
                if article_num.isdigit():
                    doc_url = f"https://ieeexplore.ieee.org/document/{article_num}"
                    self._wait()
                    self.session.get(doc_url, timeout=self.timeout)
                    self.session.headers.update({'Referer': doc_url})
                    
                    return f"https://ieeexplore.ieee.org/stampPDF/getPDF.jsp?tp=&arnumber={article_num}"
            
            return None
        except:
            return None
    
    def _unpaywall_url(self, doi: str) -> Optional[str]:
        try:
            self._wait()
            r = self.session.get(f"https://api.unpaywall.org/v2/{doi}", 
                               params={'email': self.unpaywall_email}, timeout=self.timeout)
            if r.status_code == 200 and r.json().get('best_oa_location'):
                return r.json()['best_oa_location'].get('url_for_pdf')
        except:
            pass
        return None
    
    def _doi_org_url(self, doi: str) -> Optional[str]:
        try:
            self._wait()
            r = self.session.get(f"https://doi.org/{doi}", timeout=self.timeout, allow_redirects=True)
            if 'application/pdf' in r.headers.get('Content-Type', '') or r.url.lower().endswith('.pdf'):
                return r.url
        except:
            pass
        return None
    
    def _download(self, url: str) -> Optional[bytes]:
        for attempt in range(self.max_retries):
            try:
                self._wait()
                r = self.session.get(url, timeout=self.timeout, allow_redirects=True)
                if r.status_code == 200:
                    return r.content
                elif r.status_code in [404, 403]:
                    return None
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError):
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)
            except:
                return None
        return None
    
    def _validate(self, path: str) -> bool:
        try:
            p = Path(path)
            if not p.exists() or p.stat().st_size < 1024:
                return False
            if not p.read_bytes()[:5].startswith(b'%PDF-'):
                return False
            PdfReader(str(p))
            return True
        except:
            return False
    
    def close(self):
        self.session.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, *args):
        self.close()
