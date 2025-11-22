import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* 회사 정보 */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">하이킹메이트</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              전국 등산로 정보와 GPS 산행 기록,<br />
              등산 커뮤니티를 한 곳에서
            </p>
          </div>

          {/* 빠른 링크 */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">빠른 링크</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/explore" className="hover:text-white transition">
                  등산로 탐색
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition">
                  블로그
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-white transition">
                  커뮤니티
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="hover:text-white transition">
                  문의하기
                </Link>
              </li>
            </ul>
          </div>

          {/* 법적 고지 */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">법적 고지</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  개인정보 보호정책
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-6">
          <p className="text-sm text-gray-500 text-center">
            © {currentYear} 하이킹메이트. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 text-center mt-2">
            본 사이트의 등산로 정보는 참고용이며, 실제 등산 시에는 안전에 유의하시기 바랍니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
