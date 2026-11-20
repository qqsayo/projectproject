import type { Metadata } from 'next';
import { HomeLink } from '@/components/store-shell';
import { products } from '@/lib/products';

export const metadata: Metadata = { title: 'Asset credits' };

export default function CreditsPage() {
  const photos = products.flatMap(product => [
    ...product.variants.flatMap(variant => variant.credit ? [variant.credit] : []),
    ...(product.archive ? [product.archive.credit] : []),
  ]);
  return <main id="main" className="section credits">
    <HomeLink className="underlink">Back to home</HomeLink>
    <h1>Asset credits</h1>
    <h2>Photography</h2>
    <p>Studio profiles are digital product visualizations based on the references below. Their enlarged versions are resampled and sharpened to 3840 × 2160. Derivatives retain the source license.</p>
    <ul>{photos.map(photo => <li key={photo.url}><a href={photo.url}>{photo.title}</a> by {photo.author} · <a href={photo.licenseUrl}>{photo.license}</a></li>)}</ul>
    <h2>Interactive 3D</h2>
    <ul>
      <li><a href="https://sketchfab.com/3d-models/air-jordan-1-a4b434181fbb48008ad460722fd53725">Air Jordan 1</a> by makoto · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. The homepage uses a local copy from the <a href="https://sceneview.github.io/credits.html">SceneView distribution</a>. The mesh was subdivided and regrouped into five assemblies. The original UVs were retained, the color and normal maps were refined, and the insole was modeled to follow the sole. The scene supports 3840 × 2160 PNG export.</li>
      <li><a href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MaterialsVariantsShoe">Materials Variants Shoe</a> © 2021 Shopify · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Displayed as a standalone study. The GLB retains the original geometry and materials with resized, recompressed texture maps.</li>
      {products.flatMap(product => product.scan ? [<li key={product.scan.id}><a href={product.scan.url}>{product.scan.title}</a> by {product.scan.author} · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> · View on Sketchfab.</li>] : [])}
    </ul>
    <h2>Campaign artwork</h2>
    <p>The Air Max 1 campaign angles and material macro are generated illustrations. The alternate blue color was created from the campaign artwork. Product trademarks belong to their respective owners.</p>
    <h2>Type</h2>
    <p><a href="https://github.com/rsms/inter">Inter</a> and <a href="https://github.com/jpt/barlow">Barlow Condensed</a> under the SIL Open Font License.</p>
  </main>;
}





