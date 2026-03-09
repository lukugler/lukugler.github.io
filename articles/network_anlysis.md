<div class="embed-controls">
    <a class="btn" href="/assets/all_nodes_FS.html" target="_blank" rel="noopener">Open network graph focusing Freie Sachsen</a>
</div>


***Understanding how political actors circulate information on Telegram requires more than reading a single channel—it’s about the network: who forwards whom, which narratives travel along those ties, and where content “hops” as it spreads. Summer 2023 a friends from political science asked for a project to built a dataset that maps the forwarding relations and sharing content relations surrounding the german right-wing partie *Freie Sachsen* on Telegram. This post documents the the data collection workflow, and the design choices behind it, so that others can evaluate, reuse, or extend the database. The article embeddes a network graph you can explore on your own.***

***The full dataset and analysis code are available on request. This project was conducted privately with a friend and is entirely independent of, and unaffiliated with, any institutions or employers I have worked for.***

**Inspiring & Related Works:**
- [1] <a href="https://report.cemas.io/telegram/" target="_blank" rel="noopener"><strong>"Chronologie
einer Radikalisierung"</strong> (CeMAS)</a>
- [2] <a href="https://cemas.io/en/publications/wheres-the-money-at-right-wing-extremist-fundraising-over-telegram/CeMAS_Wheres_the_Money_at_Right-wing_extremist_fundraising_over_Telegram.en.pdf" target="_blank" rel="noopener"><strong>"Where’s
the Money at? Right-wing extremist fundraising over Telegram"</strong> (CeMAS)</a>

>*Freie Sachsen* (“*Free Saxons*”) is a small far-right political group active in the German state of Saxony. It was founded in February 2021 around Chemnitz lawyer Martin Kohlmann (from the local “Pro Chemnitz” scene) together with figures from the former *NPD* (“*Die Heimat*”). From the start it used Telegram and street protests—first against COVID measures—as its main mobilization tools. Saxony’s domestic intelligence service (LfV) classifies the group as a right-wing extremist organization.

## Focus
Our goal is to map how content circulates around Freie Sachsen on Telegram by extracting and analyzing forwarding ties. We treat each forwarded post as a directed, weighted edge from the forwarding channel to the source (A → B), enabling measures of reuse (in-strength), curation (out-strength), influence (PageRank), brokerage (betweenness), and community structure. The dataset is built via snowball sampling in three waves—Node-0 (the main Freie Sachsen channel), Node-1, and Node-2—capturing the immediate local neighborhood.
<figure style="margin: 12px auto; text-align: center;">
  <img src="/assets/message.png" alt="Look into Node 1." class="resp-img" style="--w-desktop: 100%; --w-mobile: 100%; max-width: 1100px; height: auto;" />
  <figcaption>Example sample: Forwarded by “Freie Sachsen” from “Steffan Hartung” (29th April 2023)</figcaption>
</figure>

## Building the Database: Snowball Sampling
<a href="https://projecteuclid.org/journals/annals-of-mathematical-statistics/volume-32/issue-1/Snowball-Sampling/10.1214/aoms/1177705148.full" target="_blank" rel="noopener">**Snowball Sampling**</a> is a stepwise sampling strategy often used to explore hard-to-enumerate populations or networks. You begin with one or a few seed units (here: the *Freie Sachsen* telegram channel). Than the seed channel is searched for forwarded messages from other channels to discover new units telegram channels in the eco system of *Freie Sachsen*. Then, you repeat from the newly discovered channels for messages they forwarded from other channels, and so on. Each iteration “rolls” the snowball farther, accumulating more of the network. 

<figure style="margin: 12px auto; text-align: center;">
  <img src="/assets/snowball_sampling.png" alt="Snowball sampling schematic" class="resp-img" style="--w-desktop: 50%; --w-mobile: 100%; max-width: 720px; height: auto;" />
  <figcaption>Snowball sampling schematic</figcaption>
</figure>

***The dataset contains four key attributes for network analysis:***
(1) the channel that forwards, (2) the channel that originated the post, (3) the time the message/forward was posted, and (4) the raw Telegram message object for each entry. The raw message object is a dictionary that—at minimum—contains a message ID, timestamp, the text body (when present), engagement signals like view counts and forward counts (when available). Together, these fields let use track who reuses whose content, when reuse happens, and the baseline visibility of the underlying posts. Even more it would allow a topic-modelling and topic change analysis of the telegram channels. 

**Sources:**

- [3] <a href="https://projecteuclid.org/journals/annals-of-mathematical-statistics/volume-32/issue-1/Snowball-Sampling/10.1214/aoms/1177705148.full" target="_blank" rel="noopener"><strong>"Snowball Sampling"</strong> (L. Goodman, 1961)</a>
- [4] <a href="https://ca-roll.github.io/downloads/Telegram_Sampling_and_Network_Analysis.pdf" target="_blank" rel="noopener"><strong>"Network Analysis of German COVID-19 Related
Discussions on Telegram"</strong> (V. Peter et al., 2022)</a>
- [5] <a href="https://arxiv.org/html/2504.06318v2" target="_blank" rel="noopener"><strong>"The Schwurbelarchiv: a German Language Telegram dataset for the Study of Conspiracy Theories"</strong> (M. Angermaier et al., 2025)</a>

**Implementation:**
- [6] <a href="https://docs.telethon.dev/en/stable/index.html" target="_blank" rel="noopener"><strong>"Telethon"</strong></a>


## Snowball Sampling Results: The Database 

<figure style="margin: 12px auto; text-align: center;">
  <img src="/assets/console.png" alt="Look into Node 1." class="resp-img" style="--w-desktop: 60%; --w-mobile: 100%; max-width: 1100px; height: auto;" />
  <figcaption>Output snippet during the downloading process."</figcaption>
</figure>

### Node‑0: Seed Layer (Freie Sachsen)
Between 7 March 2021 and 10 July 2023, Freie Sachsen forwarded 759 messages from 105 distinct channels. Top sources included:
Most forward messages were coming from the channels “*⚒ Freie Erzgebirger ⚒*” with 105 messages, “*COMPACT-Magazin*” with 52 messages, “*FREIE SACHSEN Mittelsachsen*“ has 50 entries and the channels “*Deutsche Stimme - Die andere Meinung*” and “*Freie Sachsen Elbflorenz 🤍💚 Region Dresden*” each with 38 forwarded messages by *Freie Sachsen*.

### Node‑1: First Neighborhood
Using the 105 Node‑0 channels as seeds, we identified 54,145 forwarded messages from 2,793 distinct channels. The most frequent forwarding relationships were:

<div style="margin: 1rem 0; text-align: center; overflow-x: auto; -webkit-overflow-scrolling: touch;">
  <table style="margin: 0 auto; border-collapse: collapse; display: inline-table;">
    <thead>
      <tr>
        <th style="padding: 6px 30px; border-bottom: 1px solid #ccc; text-align: left;">Source channel</th>
        <th style="padding: 6px 30px; border-bottom: 1px solid #ccc; text-align: left;">Forwarding channel</th>
        <th style="padding: 6px 30px; border-bottom: 1px solid #ccc; text-align: right;">Interactions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><em>LUTZiges Lutz Bachmann</em></td>
        <td><em>PEGIDA – das Original</em></td>
        <td style="text-align: right;">3,753</td>
      </tr>
      <tr>
        <td><em>Siegfried Daebritz – PEGIDA Dresden</em></td>
        <td><em>PEGIDA – das Original</em></td>
        <td style="text-align: right;">2,174</td>
      </tr>
      <tr>
        <td><em>Freie Sachsen</em></td>
        <td><em>Kampf für unsere Zukunft ❣️</em></td>
        <td style="text-align: right;">1,107</td>
      </tr>
      <tr>
        <td><em>Tommy Robinson News</em></td>
        <td><em>PEGIDA – das Original</em></td>
        <td style="text-align: right;">574</td>
      </tr>
      <tr>
        <td><em>Unabhängige Nachrichten</em></td>
        <td><em>PEGIDA – das Original</em></td>
        <td style="text-align: right;">519</td>
      </tr>
    </tbody>
  </table>
</div>

### Node‑2: Second Neighborhood
In the **third sampling round** (Node-2), we identified 1,037,743 forwarded messages across 126,908 unique source–forwarding pairs. The most frequent forwarding relationships were:

<div style="margin: 1rem 0; text-align: center; overflow-x: auto; -webkit-overflow-scrolling: touch;">
  <table style="margin: 0 auto; border-collapse: collapse; display: inline-table;">
    <thead>
      <tr>
        <th style="padding: 6px 30px; border-bottom: 1px solid #ccc; text-align: left;">Source channel</th>
        <th style="padding: 6px 30px; border-bottom: 1px solid #ccc; text-align: left;">Forwarding channel</th>
        <th style="padding: 6px 30px; border-bottom: 1px solid #ccc; text-align: right;">Interactions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><em>Schuberts Lagemeldung – Stefan Schubert Offiziell</em></td>
        <td><em>Schuberts Lagemeldung – Stefan Schubert Offiziell</em></td>
        <td style="text-align: right;">14,192</td>
      </tr>
      <tr>
        <td><em>STRANGER THAN FICTION NEWS</em></td>
        <td><em>STRANGER THAN FICTION NEWS</em></td>
        <td style="text-align: right;">13,457</td>
      </tr>
      <tr>
        <td><em>Eva Herman Offiziell</em></td>
        <td><em>Eva Herman Offiziell</em></td>
        <td style="text-align: right;">12,074</td>
      </tr>
      <tr>
        <td><em>KOPP Report</em></td>
        <td><em>KOPP Report</em></td>
        <td style="text-align: right;">10,725</td>
      </tr>
      <tr>
        <td><em>LUTZiges Lutz Bachmann</em></td>
        <td><em>PEGIDA – das Original</em></td>
        <td style="text-align: right;">3,753</td>
      </tr>
    </tbody>
  </table>
</div>


## The Forward-to-Source-Interaction-Network

To see how political actors circulate information on Telegram, we model every forwarded message as a directed, weighted tie from the forwarding channel to the source whose post it shared (A → B) in a network graph. In this orientation, a channel’s in-strength tells us how often others reuse it (how much it functions as a source for a particular telegram channel), and out-strength tells us how much it forwards from others (how actively it curates). I complement these counts with <a href="https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.link_analysis.pagerank_alg.pagerank.html" target="_blank" rel="noopener">page rank</a> (are the reused by influential forwarders?), <a href="https://networkx.org/documentation/networkx-1.10/reference/generated/networkx.algorithms.centrality.betweenness_centrality.html" target="_blank" rel="noopener">betweenness centrality</a> (do you sit on weight-aware shortest paths that bridge clusters?), and <a href="https://networkx.org/documentation/stable/reference/algorithms/community.html" target="_blank" rel="noopener">community</a> detection (<a href="https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.community.quality.modularity.html#networkx.algorithms.community.quality.modularity" target="_blank" rel="noopener">greedy modularity</a> on an undirected projection) to identify cohesive milieus where forwarding is unusually concentrated.

**Further Sources:**
- [1] <a href="https://arxiv.org/pdf/cond-mat/0408187" target="_blank" rel="noopener"><strong>"Finding community structure in very large networks"</strong> (A. Clauset et al., 2004)</a>
- [2] <a href="https://arxiv.org/pdf/cond-mat/0603718" target="_blank" rel="noopener"><strong>"Statistical Mechanics of Community Detection"</strong> (J. Reichardt et al., 2006)</a>

<figure style="margin: 12px auto; text-align: center;">
  <img src="/assets/full_network_bw.png" alt="Snowball sampling schematic" class="resp-img" style="--w-desktop: 100%; --w-mobile: 100%; max-width: 1100px; height: auto;" />
  <figcaption>View into complete network graph.</figcaption>
</figure>

### Findings: The First Neighborhood (Node‑1)
The Node‑1 network contains 2,793 channels with very low directed density (0.0010): a large but selective ecosystem where attention concentrates on a small set of ties.
Within this space, Freie Sachsen is structurally central. By in‑strength it ranks #1 (5,533 forwards from other channels)—unsurprising given that it is also the sampling seed, but still informative about its role in this neighborhood.

**Strongest incoming ties:** Kampf für unsere Zukunft ❣️ → Freie Sachsen (1,107) and 🗽MarktplatzGD🗽 → Freie Sachsen (511), indicating sustained amplification by movement‑adjacent hubs.

**Forwarding behavior:** Freie Sachsen is also an active curator (out‑strength 1,111; out‑degree 105 sources), drawing especially from ⚒ Freie Erzgebirger ⚒, FREIE SACHSEN Mittelsachsen, Stefan Hartung, COMPACT‑Magazin, and Freie Sachsen Elbflorenz.

**Influence proxies** align with that reading. Freie Sachsen leads PageRank (0.0093) and betweenness (0.025), meaning influential forwarders reuse it and that it occupies bridge positions along weight‑aware shortest paths where narratives hop across sub‑communities.

**Community structure:** Freie Sachsen sits at the core of Community 2 (426 nodes; internal directed density 0.0050, tighter than the overall network). Inside the community, it is the dominant

**Boundary exchange:** On the outside → Community 2 side, channels such as 🗽MarktplatzGD🗽 (→ Freie Sachsen, 511), Patriotische Stimme für Deutschland (→ Freie Sachsen, 312), and PEGIDA – das Original (→ Freie Sachsen, 192) frequently forward posts from the Freie Sachsen milieu, exporting narratives to adjacent scenes. Conversely, on the Community 2 → outside side, Kampf für unsere Zukunft ❣️ imports from Haintz.Media, reitschuster.de, Alles Ausser Mainstream, and more; Freie Sachsen itself forwards COMPACT‑Magazin. These exchanges stitch together regional party‑like actors, protest organizers, and movement media.

**Summary:** interpretation: Freie Sachsen functions as a brokered hub: a repeatedly mined source, a selective curator, and a bridge between its regional cluster and adjacent PEGIDA/movement‑media ecosystems. Forwarding is a strong reuse signal (not identical to endorsement), dynamics can spike around events, and community labels are structural rather than semantic—but the pattern is robust.


## Zooming to interactions of Freie Sachsen
Working only with channels that actually interact with Freie Sachsen (i.e., at least one forwarding tie in either direction), the graph contains 1,030 channels and 2,930 ties, split into 16 communities (follwing modularity). In this reduced view, Freie Sachsen itself remains as structural anchor: its node has high degree (87), high PageRank (0.016) and very high betweenness (0.10)—all consistent with a brokered hub that both attracts reuse and sits on many shortest paths where narratives move between clusters.

<figure style="margin: 12px auto; text-align: center;">
  <img src="/assets/fs_network.png" alt="fs_network" class="resp-img" style="--w-desktop: 100%; --w-mobile: 100%; max-width: 1100px; height: auto;" />
  <figcaption>View into interactions graph of Freie Sachsen. Graph is linked below for own exploration.</figcaption>
</figure>

### Who are the big actors?
By degree (how many distinct partners they touch), the top layer mixes regional/movement hubs and media brands—e.g., channels like “❌impfen-nein-danke.de offiziell”, “Gurkenpaules Einflugschneise”, “Oliver Janich & Team”, and “RBK – Ceterum censeo NATO…” stand out as connectors with many neighbors. By PageRank (are you reused by influential forwarders?), Freie Sachsen ranks in the lead group, which means its content is consistently picked up by other prominent spreaders. By betweenness, Freie Sachsen again scores near the very top, underlining a bridge role: it lies on a disproportionate share of shortest routes that stitch together otherwise separate pockets of the scene.
### What does the Freie Sachsen community look like?
Community detection places Freie Sachsen in a cohesive cluster (community #1 in this layout). Inside it, you find many of the regional affiliates and proximate campaign channels we saw earlier in the dyadic counts (e.g., Kampf für unsere Zukunft ❣️, FREIE SACHSEN – Oberlausitz, Freie Sachsen Vogtland, etc.). Within this community, Freie Sachsen sits at or near the top by degree, PageRank, and betweenness, which is exactly what you expect from a brand hub that aggregates local material and amplifies it into the wider network. The net effect is a tight “core interaction zone” around FS that repeatedly exchanges content and keeps attention circulating locally.
### Which communities are strongly tied together?
If we look at edges between communities (collapsing all internal ties), the busiest “corridors” run between FS’s cluster (#1) and a neighboring media/activist cluster (#2), then between #0 ↔ #2 and #0 ↔ #1. In practical terms, that means content flows heavily along the triangle formed by FS’s orbit, a movement-media cluster, and a broader alt-news/anti-mandate cluster. Those corridors are the highways along which narratives get shared beyond the immediate FS sphere.
### Who are the bridges?
Bridge channels are the ones that either link to many distinct communities or rank in the top ~1 % of betweenness. In this slice, recurrent bridge-like actors include Haintz.Media, KOPP Report, COMPACT-Magazin, Kanal Sturmzeichen, and Informationskanal für die Neue Zeit. They each touch several communities and/or carry unusual cross-cluster traffic, making them key “transfer stations” for stories that leave one milieu and gain traction in another. In short: when a message jumps from a regional FS node to the broader right-wing infosphere (and back), it often passes through a small club of media-style hubs.

**Interactive Network Graph**
Explore the network with automatic zoom to the main cluster.

<!-- Network Graph Configuration - Edit these values to control zoom -->
<div id="network-config" style="display: none;"
     data-center-x="0.0" 
     data-center-y="0.0" 
     data-zoom-factor="3">
</div>

<div class="embed-wrap" id="network-container">
  <div class="embed-controls">
    <a class="btn" href="/assets/all_nodes_FS.html" target="_blank" rel="noopener">Open full network graph</a>
  </div>

  <iframe
    id="network-iframe"
    class="responsive-iframe network-iframe-mobile"
    src="/assets/all_nodes_FS_autozoom.html"
    title="Interactive network graph with auto-zoom"
    loading="lazy"
    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
    allow="fullscreen; accelerometer; camera; geolocation; gyroscope; microphone; clipboard-read; clipboard-write"
    onload="applyNetworkZoom()"
    style="touch-action: none; pointer-events: auto;">
  </iframe>
</div>

<script>
function applyNetworkZoom() {
  try {
    const config = document.getElementById('network-config');
    const iframe = document.getElementById('network-iframe');
    const container = document.getElementById('network-container');
    
    if (!config || !iframe) return;
    
    // Prevent mobile zoom on the container
    if (container) {
      container.addEventListener('touchstart', preventZoom, { passive: false });
      container.addEventListener('touchmove', preventZoom, { passive: false });
      container.addEventListener('touchend', preventZoom, { passive: false });
      container.addEventListener('gesturestart', preventZoom, { passive: false });
      container.addEventListener('gesturechange', preventZoom, { passive: false });
      container.addEventListener('gestureend', preventZoom, { passive: false });
    }
    
    const centerX = parseFloat(config.getAttribute('data-center-x')) || 0;
    const centerY = parseFloat(config.getAttribute('data-center-y')) || 0;
    const zoomFactor = parseFloat(config.getAttribute('data-zoom-factor')) || 2.5;
    
    // Send zoom parameters to iframe
    setTimeout(() => {
      try {
        iframe.contentWindow.postMessage({
          type: 'APPLY_ZOOM',
          centerX: centerX,
          centerY: centerY,
          zoomFactor: zoomFactor
        }, '*');
      } catch (e) {
        console.log('Could not communicate with iframe:', e.message);
      }
    }, 2000); // Wait for iframe content to load
    
  } catch (e) {
    console.log('Auto-zoom setup failed:', e.message);
  }
}

function preventZoom(e) {
  // Prevent multi-touch gestures that cause page zoom
  if (e.touches && e.touches.length > 1) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  // Prevent gesture events
  if (e.type.startsWith('gesture')) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

// Add global event listeners to prevent zoom on the entire document when iframe is focused
document.addEventListener('DOMContentLoaded', function() {
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
});
</script>

<noscript>
  The interactive network graph requires JavaScript. 
  <a href="/assets/all_nodes_FS.html" target="_blank" rel="noopener">Open the graph in a new tab</a>
</noscript>

## Limitations
Because the sample begins with Freie Sachsen, the group is structurally prominent by design, and all metrics should be read with this seed bias in mind. Forwarding indicates reuse rather than endorsement, so ties capture distribution more than agreement. Activity is event-driven and time-variable; static snapshots may miss spikes and lulls. Finally, detected communities reflect structural cohesion in forwarding patterns, not shared content or ideology.

## Summary
In the observed data slice, Freie Sachsen (one full node 0,1,2 dataset) acts as a brokered hub: a widely reused source, a selective curator, and a bridge connecting its regional cluster with PEGIDA‑adjacent and movement‑media ecosystems. This architecture facilitates narrative alignment: regional affiliates inject granular mobilization items; the hub amplifies and normalizes; neighboring clusters pick them up and recirculate them across boundaries.
