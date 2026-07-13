import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { config } from '../config';

const PRODUCTS = [
  { name: 'Вода 20 л', img: '/products/water20.png', price: '18', tag: 'Хит' },
  { name: 'Вода 0.5 л · упаковка', img: '/products/water05.png', price: '36' },
  { name: 'Кулер напольный', img: '/products/cooler.png', price: '950' },
  { name: 'Помпа электрическая', img: '/products/pump_electric.png', price: '120' },
  { name: 'Помпа ручная', img: '/products/pump_manual.png', price: '45' },
];
const MARQUEE = ['Доставка за 30 минут', 'Оплата наличными', 'Рейтинг 4.8★', 'Объём 189±0.1 л', 'Высшая категория', 'Хранение 6 месяцев', 'Чат с курьером'];
const FEATURES = [
  { icon: '⚡', title: 'Доставка в день заказа', text: 'Курьеры на линии с утра до вечера — привозим быстро по всему Душанбе.', big: true },
  { icon: '📍', title: 'Точный адрес', text: 'Геолокация или точка на карте — приедем прямо к подъезду.' },
  { icon: '💵', title: 'Оплата при доставке', text: 'Наличными курьеру. Без карт и предоплат.' },
  { icon: '⭐', title: 'Оценка курьера', text: 'Видите, кто везёт, и ставите оценку.' },
  { icon: '💬', title: 'Чат с курьером', text: 'Напишите прямо в заказе — «когда приедете?».', big: true },
];
const STEPS = [
  { n: '01', title: 'Выберите товар', text: 'Вода, кулеры, помпы — добавьте в корзину.' },
  { n: '02', title: 'Укажите адрес', text: 'Карта, геолокация или текст с ориентиром.' },
  { n: '03', title: 'Курьер в пути', text: 'Статус онлайн и чат с доставщиком.' },
  { n: '04', title: 'Оплата при доставке', text: 'Принимайте воду и платите наличными.' },
];
const REVIEWS = [
  { name: 'Манижа', text: 'Заказываю каждую неделю — всегда вовремя и вежливо. Очень удобно через сайт.' },
  { name: 'Сухроб, офис', text: '3 кулера на офис, доставка чётко по графику. Перешли и не жалеем.' },
  { name: 'Нигина', text: 'Поставила точку на карте — курьер приехал точно к подъезду. Спасибо!' },
];

function Wave({ flip, color = '#fff' }: { flip?: boolean; color?: string }) {
  return (
    <svg className="wave" style={{ transform: flip ? 'rotate(180deg)' : undefined }} viewBox="0 0 1440 90" preserveAspectRatio="none">
      <path fill={color} d="M0,40 C240,90 480,0 720,30 C960,60 1200,10 1440,45 L1440,90 L0,90 Z" />
    </svg>
  );
}

export function Landing() {
  // Появление секций при прокрутке + 3D-наклон карточек товара.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.14 },
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

    // Анимация счётчиков в hero.
    const counters = document.querySelectorAll<HTMLElement>('[data-count]');
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        cio.unobserve(el);
        const to = Number(el.dataset.count), div = Number(el.dataset.div ?? 1), suf = el.dataset.suffix ?? '';
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / 1300);
          const v = to * (1 - Math.pow(1 - p, 3));
          el.textContent = (div > 1 ? (v / div).toFixed(1) : Math.round(v).toLocaleString('ru-RU')) + suf;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    counters.forEach((c) => cio.observe(c));

    const onScroll = () => {
      const nav = document.querySelector('.lnav');
      if (nav) nav.classList.toggle('lnav--solid', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { io.disconnect(); cio.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);

  const tilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const c = e.currentTarget, r = c.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    c.style.transform = `perspective(800px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg) translateY(-6px)`;
  };
  const untilt = (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = ''; };

  return (
    <div className="landing">
      {/* NAV */}
      <header className="lnav">
        <div className="container lnav__in">
          <a href="#top" className="lnav__brand"><img src="/logo.png" alt="" /><span>ОБИ ДУШАНБЕ</span></a>
          <nav className="lnav__links">
            <a href="#products">Товары</a><a href="#features">Преимущества</a><a href="#how">Как это работает</a><a href="#contacts">Контакты</a>
          </nav>
          <div className="lnav__cta">
            <Link to="/login" className="btn btn--ghost btn--sm">Войти</Link>
            <Link to="/login" className="btn btn--sm glow">Заказать</Link>
          </div>
        </div>
      </header>

      {/* HERO — светлый, центрированный, с плавающими карточками и волнами */}
      <section className="heroL" id="top">
        <div className="heroL__blobs"><span /><span /><span /></div>
        <div className="container heroL__in">
          <span className="badge-pill reveal"><i>★</i> 4.8 · любимый сервис доставки воды в Душанбе</span>
          <h1 className="heroL__title reveal">Вода, которая <span className="grad-text">приезжает сама</span></h1>
          <p className="heroL__sub reveal">20-литровые бутыли, кулеры и помпы. Онлайн-заказ за минуту, доставка в день заказа, оплата наличными при получении.</p>
          <div className="heroL__cta reveal">
            <Link to="/login" className="btn btn--lg glow">Заказать воду →</Link>
            <a href="#products" className="btn btn--ghost btn--lg">Смотреть товары</a>
          </div>

          <div className="heroL__stage reveal">
            <div className="heroL__ring" />
            <div className="heroL__podium" />
            <img className="heroL__bottle" src="/products/water20.png" alt="Бутыль 20 л" />

            <div className="fchip fchip--tl"><span className="fchip__ico">💧</span><div><b>189±0.1 л</b><small>объём бутыли</small></div></div>
            <div className="fchip fchip--tr"><span className="ava-mini">А</span><div><b>Алишер · ★ 4.9</b><small>5 мин до вас</small></div></div>
            <div className="fchip fchip--bl"><div><b data-count="2400" data-suffix="+">0</b><small>доставок / месяц</small></div></div>
            <div className="fchip fchip--br"><span className="fchip__badge">В пути</span><div><b>Заказ #1287</b><small>Вода 20 л × 2</small></div></div>
          </div>
        </div>

        <div className="heroL__waves">
          <svg className="waveL waveL--back" viewBox="0 0 2880 120" preserveAspectRatio="none"><path d="M0,70 C240,30 480,110 720,70 C960,30 1200,110 1440,70 C1680,30 1920,110 2160,70 C2400,30 2640,110 2880,70 L2880,120 L0,120 Z" /></svg>
          <svg className="waveL waveL--mid" viewBox="0 0 2880 120" preserveAspectRatio="none"><path d="M0,80 C240,50 480,110 720,80 C960,50 1200,110 1440,80 C1680,50 1920,110 2160,80 C2400,50 2640,110 2880,80 L2880,120 L0,120 Z" /></svg>
          <svg className="waveL waveL--front" viewBox="0 0 2880 120" preserveAspectRatio="none"><path d="M0,92 C240,70 480,116 720,92 C960,70 1200,116 1440,92 C1680,70 1920,116 2160,92 C2400,70 2640,116 2880,92 L2880,120 L0,120 Z" /></svg>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee">
        <div className="marquee__track">
          {[...MARQUEE, ...MARQUEE].map((m, i) => <span key={i}>{m}<i>◆</i></span>)}
        </div>
      </div>

      {/* PRODUCTS */}
      <section className="section" id="products">
        <div className="container">
          <div className="section__head reveal"><span className="kicker">Каталог</span><h2>Всё для чистой воды</h2><p className="muted">Наведите на товар — он оживёт</p></div>
          <div className="pgrid3 reveal">
            {PRODUCTS.map((p) => (
              <div className="p3" key={p.name} onMouseMove={tilt} onMouseLeave={untilt}>
                {p.tag && <span className="p3__tag">{p.tag}</span>}
                <div className="p3__img"><img src={p.img} alt={p.name} /></div>
                <div className="p3__name">{p.name}</div>
                <div className="p3__foot"><span className="p3__price">{p.price}<i>смн</i></span><Link to="/login" className="p3__btn">+</Link></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section className="section section--dark" id="features">
        <Wave flip color="#0b1017" />
        <div className="container">
          <div className="section__head reveal"><span className="kicker kicker--light">Почему мы</span><h2 className="light">Сервис, к которому привыкаешь</h2></div>
          <div className="bento reveal">
            {FEATURES.map((f) => (
              <div className={`bento__cell ${f.big ? 'bento__cell--big' : ''}`} key={f.title}>
                <div className="bento__icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
        <Wave color="#0b1017" />
      </section>

      {/* HOW */}
      <section className="section" id="how">
        <div className="container">
          <div className="section__head reveal"><span className="kicker">Просто</span><h2>Как это работает</h2></div>
          <div className="timeline reveal">
            {STEPS.map((s, i) => (
              <div className="tstep" key={s.n} style={{ ['--d' as any]: `${i * 0.08}s` }}>
                <div className="tstep__n">{s.n}</div>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section section--alt">
        <div className="container">
          <div className="section__head reveal"><span className="kicker">Отзывы</span><h2>Нам доверяют</h2><p className="muted">Более 380 семей и офисов Душанбе</p></div>
          <div className="tgrid reveal">
            {REVIEWS.map((r) => (
              <figure className="t3" key={r.name}>
                <div className="t3__quote">”</div>
                <blockquote>{r.text}</blockquote>
                <figcaption><span className="t3__ava">{r.name[0]}</span><b>{r.name}</b><span className="t3__stars">★★★★★</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* APP PROMO */}
      <section className="section">
        <div className="container">
          <div className="promo reveal">
            <div className="promo__mesh" />
            <div className="promo__text">
              <span className="kicker kicker--light">Приложение</span>
              <h2 className="light">Вся вода — в кармане</h2>
              <p>iOS и Android: те же товары, статусы заказа онлайн и чат с курьером.</p>
              <div className="promo__badges"><span className="storebtn"> App Store</span><span className="storebtn">▶ Google Play</span></div>
            </div>
            <div className="promo__phone">
              <div className="phone">
                <div className="phone__top" />
                <div className="phone__screen">
                  <img src="/logo.png" alt="" className="phone__logo" />
                  <div className="phone__card"><img src="/products/water20.png" alt="" /><div><b>Вода 20 л</b><small>18 смн</small></div><span>+</span></div>
                  <div className="phone__card"><img src="/products/cooler.png" alt="" /><div><b>Кулер</b><small>950 смн</small></div><span>+</span></div>
                  <div className="phone__cta">Оформить заказ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta3">
        <div className="cta3__mesh" />
        <div className="container cta3__in reveal">
          <h2>Готовы заказать воду?</h2>
          <p>Онлайн-заказ за минуту. Сайт и приложение — одинаково удобно.</p>
          <Link to="/login" className="btn btn--lg glow-strong">Заказать сейчас →</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer3" id="contacts">
        <div className="container footer__in">
          <div className="footer__brand">
            <a href="#top" className="lnav__brand lnav__brand--light"><img src="/logo.png" alt="" /><span>ОБИ ДУШАНБЕ</span></a>
            <p className="footer__tag">Доставка чистой питьевой воды в Душанбе. Работаем ежедневно.</p>
          </div>
          <div className="footer__col"><h4>Телефоны</h4>{config.phones.map((ph) => <a key={ph} href={`tel:${ph.replace(/[^\d+]/g, '')}`}>{ph}</a>)}</div>
          <div className="footer__col"><h4>Компания</h4><a href="#products">Товары</a><a href="#how">Доставка</a><a href="#features">Преимущества</a></div>
          <div className="footer__col"><h4>Вход</h4><Link to="/login">Заказать онлайн</Link><Link to="/login">Кабинет курьера</Link><Link to="/login">Кабинет владельца</Link></div>
        </div>
        <div className="container footer__bottom"><span>© {new Date().getFullYear()} ОБИ ДУШАНБЕ · {config.address}</span><span>Оплата наличными при доставке</span></div>
      </footer>
    </div>
  );
}
