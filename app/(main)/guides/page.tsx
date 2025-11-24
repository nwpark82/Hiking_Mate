import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Mountain, AlertTriangle, Heart, Sunrise, Backpack, MapPin, Thermometer, Footprints, CheckCircle2, Info } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: '등산 가이드 | 하이킹메이트 - 초보자를 위한 완벽 가이드',
  description: '등산 초보자를 위한 완벽한 가이드. 준비물, 안전수칙, 계절별 팁, 난이도별 추천 코스까지 등산에 필요한 모든 정보를 확인하세요.',
  keywords: '등산 가이드, 등산 초보, 등산 준비물, 등산 안전수칙, 등산 팁, 하이킹',
};

export default function GuidesPage() {
  return (
    <>
      <Header title="등산 가이드" />

      <main className="max-w-screen-lg mx-auto p-4 pb-24">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-forest-500 via-forest-600 to-forest-700 rounded-3xl p-8 md:p-10 text-white mb-8">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
              <Mountain className="w-4 h-4" />
              <span className="text-xs font-bold">초보자를 위한 완벽 가이드</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
              안전하고 즐거운 등산을 위한
              <br />
              필수 가이드
            </h1>
            <p className="text-forest-100 text-base md:text-lg font-medium">
              등산 전 꼭 알아야 할 준비사항부터 안전수칙까지 모든 것을 안내합니다
            </p>
          </div>
        </section>

        {/* Quick Links */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <a href="#beginners" className="bg-white rounded-xl p-4 shadow-soft hover:shadow-md transition-all border border-gray-100 text-center">
            <span className="text-3xl mb-2 block">👋</span>
            <p className="text-sm font-semibold text-gray-900">초보자 가이드</p>
          </a>
          <a href="#equipment" className="bg-white rounded-xl p-4 shadow-soft hover:shadow-md transition-all border border-gray-100 text-center">
            <span className="text-3xl mb-2 block">🎒</span>
            <p className="text-sm font-semibold text-gray-900">준비물</p>
          </a>
          <a href="#safety" className="bg-white rounded-xl p-4 shadow-soft hover:shadow-md transition-all border border-gray-100 text-center">
            <span className="text-3xl mb-2 block">⚠️</span>
            <p className="text-sm font-semibold text-gray-900">안전수칙</p>
          </a>
          <a href="#seasons" className="bg-white rounded-xl p-4 shadow-soft hover:shadow-md transition-all border border-gray-100 text-center">
            <span className="text-3xl mb-2 block">🌸</span>
            <p className="text-sm font-semibold text-gray-900">계절별 팁</p>
          </a>
        </section>

        {/* 초보자 가이드 */}
        <section id="beginners" className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-forest-100 rounded-xl">
              <Mountain className="w-6 h-6 text-forest-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">초보자를 위한 등산 가이드</h2>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">등산을 시작하기 전에</h3>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  등산은 자연을 가까이에서 느끼고 건강을 증진할 수 있는 훌륭한 활동입니다.
                  하지만 준비 없이 시작하면 위험할 수 있으므로, 초보자분들은 다음 사항들을 꼭 숙지하시기 바랍니다.
                </p>
                <p>
                  등산은 단순히 산을 오르는 것 이상의 의미를 가집니다. 체력 향상은 물론이고 정신적 힐링,
                  자연과의 교감을 통해 삶의 질을 높일 수 있는 활동입니다. 전국 663개 이상의 등산로가 여러분을 기다리고 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-forest-600" />
                  <h4 className="font-bold text-gray-900">1단계: 적절한 코스 선택</h4>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  첫 등산은 왕복 3-4시간 이내의 초급 코스를 선택하세요.
                  경사가 완만하고 길이 잘 정비된 코스가 좋습니다.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 왕복 4km 이내 코스</li>
                  <li>• 고도 차이 500m 이내</li>
                  <li>• 등산로 난이도: 초급</li>
                  <li>• 소요시간: 3-4시간</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-forest-600" />
                  <h4 className="font-bold text-gray-900">2단계: 날씨 확인</h4>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  등산 전날과 당일 날씨를 반드시 확인하세요.
                  비가 오거나 기상 악화가 예상되면 등산을 연기하는 것이 안전합니다.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 강수확률 30% 이상: 연기 권장</li>
                  <li>• 미세먼지 '나쁨' 이상: 주의</li>
                  <li>• 산악 지역 날씨 별도 확인</li>
                  <li>• 일몰 시간 2시간 전 하산</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 준비물 가이드 */}
        <section id="equipment" className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-sky-100 rounded-xl">
              <Backpack className="w-6 h-6 text-sky-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">등산 준비물 체크리스트</h2>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">필수 준비물</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Footprints className="w-5 h-5 text-forest-600" />
                    기본 장비
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-forest-600 font-bold">•</span>
                      <span><strong>등산화:</strong> 발목을 보호하는 미들컷 이상 권장. 방수 기능이 있으면 더욱 좋습니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-forest-600 font-bold">•</span>
                      <span><strong>배낭:</strong> 20-30L 용량의 가벼운 배낭. 허리와 가슴 벨트가 있는 제품 추천.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-forest-600 font-bold">•</span>
                      <span><strong>등산복:</strong> 속건성 있는 기능성 의류. 면 소재는 피하세요.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-forest-600 font-bold">•</span>
                      <span><strong>등산 스틱:</strong> 무릎 보호와 균형 유지에 도움. 접이식이 휴대하기 편리합니다.</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    안전 · 응급 용품
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span><strong>구급약:</strong> 밴드, 소독약, 진통제, 개인 상비약</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span><strong>헤드랜턴:</strong> 예상치 못한 야간 하산 대비</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span><strong>비상식량:</strong> 초콜릿, 에너지바 등</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span><strong>휴대폰 보조배터리:</strong> 긴급 상황 대비</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">물과 간식</h3>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>
                  <strong>물:</strong> 1인당 1.5L 이상 준비하세요. 여름철에는 2L 이상 권장합니다.
                  탈수는 등산 중 가장 흔한 문제 중 하나이므로 충분한 수분 섭취가 필수입니다.
                </p>
                <p>
                  <strong>간식:</strong> 에너지 보충을 위해 견과류, 말린 과일, 초콜릿, 에너지바 등을 준비하세요.
                  2-3시간 등산 시 최소 2-3회 간식 섭취를 권장합니다.
                </p>
                <div className="bg-forest-50 rounded-lg p-4 border border-forest-200 mt-4">
                  <p className="text-sm font-semibold text-forest-900 mb-2">💡 Pro Tip</p>
                  <p className="text-sm text-forest-800">
                    등산 중에는 목이 마르기 전에 미리미리 물을 마시는 것이 좋습니다.
                    한 번에 많이 마시기보다는 조금씩 자주 마시는 것이 효과적입니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 안전수칙 */}
        <section id="safety" className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">등산 안전수칙</h2>
          </div>

          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-red-900 mb-4">반드시 지켜야 할 10가지 안전수칙</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-sm font-bold">1</span>
                    <h4 className="font-semibold text-gray-900">등산 계획 공유</h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    가족이나 친구에게 등산 코스, 예상 하산 시간을 미리 알려주세요.
                    긴급 상황 시 신속한 대응이 가능합니다.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-sm font-bold">2</span>
                    <h4 className="font-semibold text-gray-900">정해진 등산로 이용</h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    표지판이 있는 정규 등산로만 이용하세요.
                    샛길이나 통제 구역 출입은 절대 금지입니다.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-sm font-bold">3</span>
                    <h4 className="font-semibold text-gray-900">체력 안배</h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    무리하지 말고 자신의 체력에 맞춰 천천히 등산하세요.
                    급경사에서는 더욱 여유있게 오르세요.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-sm font-bold">4</span>
                    <h4 className="font-semibold text-gray-900">일몰 2시간 전 하산</h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    해가 지기 최소 2시간 전에는 하산을 시작해야 합니다.
                    어둠 속 하산은 매우 위험합니다.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-sm font-bold">5</span>
                    <h4 className="font-semibold text-gray-900">위급 시 119 신고</h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    사고 발생 시 즉시 119에 신고하고,
                    국가지점번호나 현재 위치를 정확히 알려주세요.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-sm font-bold">6</span>
                    <h4 className="font-semibold text-gray-900">기상 악화 시 즉시 하산</h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    비, 천둥, 번개 등 기상이 악화되면 즉시 하산하세요.
                    산 정상 근처는 특히 위험합니다.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-sm font-bold">7</span>
                    <h4 className="font-semibold text-gray-900">단독 등산 자제</h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    가급적 2명 이상 함께 등산하세요.
                    단독 등산 시 위급 상황 대처가 어렵습니다.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-sm font-bold">8</span>
                    <h4 className="font-semibold text-gray-900">쓰레기 되가져가기</h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    자연보호를 위해 쓰레기는 반드시 되가져가세요.
                    작은 음식물 찌꺼기도 예외가 아닙니다.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-sm font-bold">9</span>
                    <h4 className="font-semibold text-gray-900">충분한 휴식</h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    1시간 등산 후 10-15분 휴식을 취하세요.
                    무리한 속도는 사고의 원인이 됩니다.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full text-sm font-bold">10</span>
                    <h4 className="font-semibold text-gray-900">스트레칭 필수</h4>
                  </div>
                  <p className="text-sm text-gray-700">
                    등산 전후 충분한 스트레칭으로 부상을 예방하세요.
                    특히 하산 후 스트레칭이 중요합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">응급 상황 대처법</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">조난 시</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• 즉시 119 신고 (국가지점번호 또는 GPS 좌표 전달)</li>
                    <li>• 한 자리에서 대기하며 체온 유지</li>
                    <li>• 휘슬이나 소리로 구조대에 위치 알림</li>
                    <li>• 휴대폰 배터리 절약 (비행기 모드 활용)</li>
                  </ul>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">부상 시</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• 경미한 부상: 응급처치 후 천천히 하산</li>
                    <li>• 심각한 부상: 움직이지 말고 119 신고</li>
                    <li>• 지혈, 고정 등 기본 응급처치 실시</li>
                    <li>• 체온 유지 및 안정 취하기</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 계절별 등산 팁 */}
        <section id="seasons" className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-sunset-100 rounded-xl">
              <Thermometer className="w-6 h-6 text-sunset-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">계절별 등산 가이드</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl">🌸</span>
                  <h3 className="text-xl font-bold text-gray-900">봄 (3-5월)</h3>
                </div>
                <div className="space-y-3 text-gray-700">
                  <p className="font-semibold text-forest-900">특징 및 주의사항</p>
                  <ul className="space-y-2 text-sm">
                    <li>• 일교차가 크므로 겉옷 필수 지참</li>
                    <li>• 진드기 활동 시기: 긴 옷 착용 권장</li>
                    <li>• 봄꽃 명소는 혼잡할 수 있으니 이른 시간 출발</li>
                    <li>• 황사, 미세먼지 확인 후 등산</li>
                  </ul>
                  <p className="font-semibold text-forest-900 pt-2">추천 활동</p>
                  <p className="text-sm">벚꽃, 진달래, 철쭉 감상. 신록이 아름다운 계곡 트레킹</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl">☀️</span>
                  <h3 className="text-xl font-bold text-gray-900">여름 (6-8월)</h3>
                </div>
                <div className="space-y-3 text-gray-700">
                  <p className="font-semibold text-forest-900">특징 및 주의사항</p>
                  <ul className="space-y-2 text-sm">
                    <li>• 물 2L 이상 필수 지참 (탈수 주의)</li>
                    <li>• 선크림, 모자, 선글라스 착용</li>
                    <li>• 집중호우 예보 시 등산 자제</li>
                    <li>• 뱀, 벌 조심 (풀숲, 바위틈 주의)</li>
                    <li>• 오전 일찍 등산 시작 권장</li>
                  </ul>
                  <p className="font-semibold text-forest-900 pt-2">추천 활동</p>
                  <p className="text-sm">계곡 트레킹, 폭포 감상. 시원한 숲길 산책</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl">🍂</span>
                  <h3 className="text-xl font-bold text-gray-900">가을 (9-11월)</h3>
                </div>
                <div className="space-y-3 text-gray-700">
                  <p className="font-semibold text-forest-900">특징 및 주의사항</p>
                  <ul className="space-y-2 text-sm">
                    <li>• 등산하기 가장 좋은 계절</li>
                    <li>• 단풍 명소는 매우 혼잡 (교통체증 주의)</li>
                    <li>• 일몰이 빨라지므로 일찍 하산</li>
                    <li>• 일교차 크므로 보온 의류 준비</li>
                  </ul>
                  <p className="font-semibold text-forest-900 pt-2">추천 활동</p>
                  <p className="text-sm">단풍 감상, 억새 트레킹. 선선한 날씨의 장거리 등산</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl">❄️</span>
                  <h3 className="text-xl font-bold text-gray-900">겨울 (12-2월)</h3>
                </div>
                <div className="space-y-3 text-gray-700">
                  <p className="font-semibold text-forest-900">특징 및 주의사항</p>
                  <ul className="space-y-2 text-sm">
                    <li>• 아이젠, 스패츠 등 겨울 장비 필수</li>
                    <li>• 저체온증 주의 (보온 의류 여분 지참)</li>
                    <li>• 눈길, 빙판길 낙상 주의</li>
                    <li>• 일몰이 빠르므로 오전 등산 권장</li>
                    <li>• 폭설 시 등산 금지</li>
                  </ul>
                  <p className="font-semibold text-forest-900 pt-2">추천 활동</p>
                  <p className="text-sm">설산 트레킹, 상고대 감상. 온천과 함께하는 등산 여행</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 난이도별 추천 코스 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-mountain-100 rounded-xl">
              <MapPin className="w-6 h-6 text-mountain-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">난이도별 추천 코스</h2>
          </div>

          <div className="grid gap-4">
            <Card className="border-green-200 bg-gradient-to-br from-white to-green-50/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">초급</span>
                  <h3 className="text-lg font-bold text-gray-900">처음 등산하는 분들께</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  완만한 경사의 잘 정비된 등산로입니다.
                  왕복 3-4시간 소요되며, 가족 단위 등산객에게 적합합니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-white px-3 py-1 rounded-full border border-green-200">경사 완만</span>
                  <span className="text-xs bg-white px-3 py-1 rounded-full border border-green-200">등산로 정비 우수</span>
                  <span className="text-xs bg-white px-3 py-1 rounded-full border border-green-200">편의시설 있음</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-gradient-to-br from-white to-yellow-50/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-bold rounded-full">중급</span>
                  <h3 className="text-lg font-bold text-gray-900">등산에 익숙해진 분들께</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  적당한 경사와 거리의 등산로입니다.
                  왕복 4-6시간 소요되며, 체력 향상에 도움이 됩니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-white px-3 py-1 rounded-full border border-yellow-200">적당한 경사</span>
                  <span className="text-xs bg-white px-3 py-1 rounded-full border border-yellow-200">암석 구간 일부</span>
                  <span className="text-xs bg-white px-3 py-1 rounded-full border border-yellow-200">체력 필요</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-gradient-to-br from-white to-red-50/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">고급</span>
                  <h3 className="text-lg font-bold text-gray-900">경험이 풍부한 분들께</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  가파른 경사와 긴 거리의 등산로입니다.
                  왕복 6시간 이상 소요되며, 충분한 준비와 체력이 필요합니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-white px-3 py-1 rounded-full border border-red-200">급경사 구간</span>
                  <span className="text-xs bg-white px-3 py-1 rounded-full border border-red-200">암벽 등반 포함</span>
                  <span className="text-xs bg-white px-3 py-1 rounded-full border border-red-200">우수한 체력 필요</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-forest-500 to-mountain-500 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">지금 바로 등산을 시작해보세요!</h3>
          <p className="text-forest-50 mb-6">
            전국 663개 등산로 정보와 실시간 날씨를 확인하고
            <br className="hidden md:block" />
            안전하고 즐거운 등산을 계획하세요
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 bg-white text-forest-600 px-6 py-3 rounded-xl font-bold hover:bg-forest-50 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <MapPin className="w-5 h-5" />
              등산로 둘러보기
            </Link>
            <Link
              href="/community"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition-all duration-300"
            >
              커뮤니티 참여하기
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
