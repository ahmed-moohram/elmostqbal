import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * مكون التنقل الفائق السرعة
 * Ultra-Fast Navigation Component
 */

// ========================================
// 1. مكون الرابط السريع
// ========================================

export const FastLink = memo(({ to, children, className, prefetch = true, ...props }) => {
  const navigate = useNavigate();
  const linkRef = useRef(null);
  const [isPrefetched, setIsPrefetched] = useState(false);
  const prefetchTimeout = useRef(null);

  // التحميل المسبق عند مرور الماوس
  const handleMouseEnter = useCallback(() => {
    if (!prefetch || isPrefetched) return;

    // تأخير صغير لتجنب التحميل العشوائي
    prefetchTimeout.current = setTimeout(() => {
      prefetchPage(to);
      setIsPrefetched(true);
    }, 100);
  }, [to, prefetch, isPrefetched]);

  // إلغاء التحميل المسبق عند الخروج السريع
  const handleMouseLeave = useCallback(() => {
    if (prefetchTimeout.current) {
      clearTimeout(prefetchTimeout.current);
    }
  }, []);

  // التنقل الفوري
  const handleClick = useCallback((e) => {
    e.preventDefault();
    
    // تأثير النقر السريع
    if (linkRef.current) {
      linkRef.current.style.transform = 'scale(0.98)';
      setTimeout(() => {
        if (linkRef.current) {
          linkRef.current.style.transform = 'scale(1)';
        }
      }, 100);
    }

    // التنقل مع الحركة السلسة
    requestAnimationFrame(() => {
      navigate(to);
    });
  }, [navigate, to]);

  // التحميل المسبق للصفحة
  const prefetchPage = async (url) => {
    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'document';
      document.head.appendChild(link);
    } catch (error) {
      console.error('Prefetch failed:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (prefetchTimeout.current) {
        clearTimeout(prefetchTimeout.current);
      }
    };
  }, []);

  return (
    <a
      ref={linkRef}
      href={to}
      className={`fast-link ${className || ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: 'transform 0.1s ease',
        cursor: 'pointer'
      }}
      {...props}
    >
      {children}
    </a>
  );
});

// ========================================
// 2. مكون التنقل بالتمرير اللانهائي
// ========================================

export const InfiniteScroll = memo(({ 
  loadMore, 
  hasMore, 
  loader, 
  children,
  threshold = 100 
}) => {
  const [loading, setLoading] = useState(false);
  const observerRef = useRef(null);
  const loadingRef = useRef(null);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver(async (entries) => {
      const [entry] = entries;
      
      if (entry.isIntersecting && hasMore && !loading) {
        setLoading(true);
        await loadMore();
        setLoading(false);
      }
    }, options);

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, loading, threshold]);

  return (
    <>
      {children}
      {hasMore && (
        <div ref={loadingRef} className="infinite-scroll-loader">
          {loading && (loader || <DefaultLoader />)}
        </div>
      )}
    </>
  );
});

// ========================================
// 3. مكون التحميل الكسول للصور
// ========================================

export const LazyImage = memo(({ 
  src, 
  alt, 
  placeholder, 
  className,
  onLoad,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '/placeholder.jpg');
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // تحميل الصورة
            const img = new Image();
            img.src = src;
            img.onload = () => {
              setImageSrc(src);
              setIsLoaded(true);
              if (onLoad) onLoad();
            };
            
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, onLoad]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`lazy-image ${className || ''} ${isLoaded ? 'loaded' : 'loading'}`}
      style={{
        transition: 'opacity 0.3s ease',
        opacity: isLoaded ? 1 : 0.7
      }}
      {...props}
    />
  );
});

// ========================================
// 4. مكون التبويبات السريعة
// ========================================

export const FastTabs = memo(({ tabs, defaultTab = 0, onChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [tabContent, setTabContent] = useState({});
  const contentRef = useRef(null);

  // تحميل مسبق لجميع التبويبات
  useEffect(() => {
    tabs.forEach((tab, index) => {
      if (tab.lazy && !tabContent[index]) {
        // تحميل المحتوى في الخلفية
        setTimeout(() => {
          setTabContent(prev => ({
            ...prev,
            [index]: tab.content
          }));
        }, index * 100);
      }
    });
  }, [tabs]);

  const handleTabChange = useCallback((index) => {
    // حركة سلسة للمحتوى
    if (contentRef.current) {
      contentRef.current.style.opacity = '0';
      contentRef.current.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        setActiveTab(index);
        if (onChange) onChange(index);
        
        if (contentRef.current) {
          contentRef.current.style.opacity = '1';
          contentRef.current.style.transform = 'translateY(0)';
        }
      }, 150);
    } else {
      setActiveTab(index);
      if (onChange) onChange(index);
    }
  }, [onChange]);

  return (
    <div className="fast-tabs">
      <div className="tabs-header">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tab-button ${activeTab === index ? 'active' : ''}`}
            onClick={() => handleTabChange(index)}
            style={{
              transition: 'all 0.2s ease',
              borderBottom: activeTab === index ? '2px solid var(--primary)' : 'none'
            }}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
            {tab.badge && <span className="tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>
      
      <div 
        ref={contentRef}
        className="tabs-content"
        style={{
          transition: 'all 0.15s ease',
          minHeight: '200px'
        }}
      >
        {tabs[activeTab].lazy 
          ? (tabContent[activeTab] || <TabLoader />)
          : tabs[activeTab].content
        }
      </div>
    </div>
  );
});

// ========================================
// 5. مكون البحث الفوري
// ========================================

export const InstantSearch = memo(({ 
  onSearch, 
  placeholder = "ابحث...",
  debounceTime = 300 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef(null);
  const abortController = useRef(null);

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    // إلغاء الطلب السابق
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    setLoading(true);

    try {
      const searchResults = await onSearch(searchQuery, abortController.current.signal);
      setResults(searchResults);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [onSearch]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);

    // إلغاء البحث السابق
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // بحث جديد بعد التأخير
    searchTimeout.current = setTimeout(() => {
      performSearch(value);
    }, debounceTime);
  }, [performSearch, debounceTime]);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return (
    <div className="instant-search">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="search-input"
          autoComplete="off"
        />
        {loading && <span className="search-spinner">⟳</span>}
      </div>
      
      {results.length > 0 && (
        <div className="search-results">
          {results.map((result, index) => (
            <SearchResult key={index} {...result} />
          ))}
        </div>
      )}
    </div>
  );
});

// ========================================
// 6. مكونات مساعدة
// ========================================

const DefaultLoader = () => (
  <div className="default-loader">
    <div className="spinner"></div>
    <span>جاري التحميل...</span>
  </div>
);

const TabLoader = () => (
  <div className="tab-loader">
    <div className="skeleton-line" style={{ width: '80%' }}></div>
    <div className="skeleton-line" style={{ width: '60%' }}></div>
    <div className="skeleton-line" style={{ width: '70%' }}></div>
  </div>
);

const SearchResult = ({ title, description, url }) => (
  <FastLink to={url} className="search-result-item">
    <h4>{title}</h4>
    <p>{description}</p>
  </FastLink>
);

// ========================================
// 7. Hook للتنقل المحسّن
// ========================================

export const useOptimizedNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  const optimizedNavigate = useCallback(async (to, options = {}) => {
    if (isNavigating) return;
    
    setIsNavigating(true);

    // تأثير الخروج
    document.body.style.opacity = '0.95';
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // التنقل
    navigate(to, options);
    
    // تأثير الدخول
    document.body.style.opacity = '1';
    
    setIsNavigating(false);
  }, [navigate, isNavigating]);

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  const goForward = useCallback(() => {
    window.history.forward();
  }, []);

  return {
    navigate: optimizedNavigate,
    goBack,
    goForward,
    location,
    isNavigating
  };
};

// ========================================
// 8. الأنماط CSS
// ========================================

const styles = `
  .fast-link {
    text-decoration: none;
    color: inherit;
    display: inline-block;
  }

  .lazy-image {
    display: block;
    width: 100%;
    height: auto;
  }

  .lazy-image.loading {
    filter: blur(5px);
  }

  .lazy-image.loaded {
    filter: blur(0);
  }

  .fast-tabs {
    width: 100%;
  }

  .tabs-header {
    display: flex;
    gap: 1rem;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 1rem;
  }

  .tab-button {
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    color: #666;
    position: relative;
    transition: all 0.2s ease;
  }

  .tab-button.active {
    color: var(--primary, #007bff);
    font-weight: 600;
  }

  .tab-button:hover {
    color: var(--primary, #007bff);
  }

  .instant-search {
    position: relative;
    width: 100%;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary, #007bff);
  }

  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin-top: 0.5rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
  }

  .search-result-item {
    padding: 1rem;
    border-bottom: 1px solid #f0f0f0;
    display: block;
    transition: background-color 0.2s ease;
  }

  .search-result-item:hover {
    background-color: #f8f9fa;
  }

  .search-result-item:last-child {
    border-bottom: none;
  }

  .skeleton-line {
    height: 1rem;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    margin-bottom: 0.5rem;
    border-radius: 4px;
  }

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid var(--primary, #007bff);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// إضافة الأنماط للصفحة
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default FastLink;
