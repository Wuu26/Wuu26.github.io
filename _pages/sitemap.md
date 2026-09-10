---
layout: archive
title: "Sitemap"
title_zh: "站点地图"
permalink: /sitemap/
author_profile: true
---

{% include base_path %}

<p class="lang-en" lang="en">Browse the pages on this site. An <a href="{{ base_path }}/sitemap.xml">XML sitemap</a> is also available.</p>
<p class="lang-zh" lang="zh-CN" hidden>浏览本站页面，也可以查看 <a href="{{ base_path }}/sitemap.xml">XML 站点地图</a>。</p>

<ul>
{% for link in site.data.navigation.main %}
  <li><a href="{{ base_path }}{{ link.url }}" data-lang-en="{{ link.title | escape }}" data-lang-zh="{{ link.title_zh | escape }}">{{ link.title }}</a></li>
{% endfor %}
</ul>
