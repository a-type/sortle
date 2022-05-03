import dynamic from 'next/dynamic';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

const TileList = dynamic(
  () => import('../components/tiles').then((mod) => mod.TileList),
  {
    ssr: false,
  },
);

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Sortle</title>
        <meta name="description" content="A language-less sorting game" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <TileList />
      </main>

      <footer className={styles.footer}>
        <a href="https://gfor.rest" target="_blank" rel="noopener noreferrer">
          Made by Grant
        </a>
      </footer>
    </div>
  );
}
