package umc.cdc.hds.httpserver;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InterruptedIOException;
import java.net.BindException;
import java.net.URI;
import java.net.URL;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletResponse;

import com.google.common.collect.ImmutableMap;

import org.mortbay.jetty.Connector;
import org.mortbay.jetty.Handler;
import org.mortbay.jetty.Server;
import org.mortbay.jetty.SessionManager;
import org.mortbay.jetty.handler.ContextHandlerCollection;
import org.mortbay.jetty.nio.SelectChannelConnector;
import org.mortbay.jetty.servlet.AbstractSessionManager;
import org.mortbay.jetty.servlet.Context;
import org.mortbay.jetty.servlet.DefaultServlet;
import org.mortbay.jetty.servlet.FilterHolder;
import org.mortbay.jetty.servlet.SessionHandler;
import org.mortbay.jetty.servlet.FilterMapping;
import org.mortbay.jetty.servlet.ServletHandler;
import org.mortbay.jetty.servlet.ServletHolder;
import org.mortbay.jetty.webapp.WebAppContext;
import org.mortbay.thread.QueuedThreadPool;
import org.mortbay.util.MultiException;

import com.google.common.base.Preconditions;
import com.google.common.collect.Lists;

public class HdsWebServer {

	// The ServletContext attribute where the daemon Configuration
	// gets stored.
	public static final String NO_CACHE_FILTER = "NoCacheFilter";

	protected final Server webServer;

	private final List<Connector> listeners = Lists.newArrayList();

	protected final WebAppContext webAppContext;
	protected final Map<Context, Boolean> defaultContexts =
		new HashMap<>();

	private HdsWebServer(String name, URI endpoint) throws IOException {
		final String appDir = getWebAppsPath(name);

		this.webServer = new Server();

		this.webAppContext = createWebAppContext(name, appDir);

		initializeWebServer(name);

		if (endpoint == null) {
			LOG.info("endpoint == null");
		} else {
			final Connector listener;
			String scheme = endpoint.getScheme();
			if ("http".equals(scheme)) {
				listener = HdsWebServer.createDefaultChannelConnector();
			} else {
				throw new IOException("unknown scheme for endpoint:" + endpoint);
			}
			listener.setHost(endpoint.getHost());
			listener.setPort(endpoint.getPort() == -1 ? 0 : endpoint.getPort());
			addListener(listener);
			loadListeners();
		}
	}

	/**
	 * Get the pathname to the webapps files.
	 * @param appName eg "secondary" or "datanode"
	 * @return the pathname as a URL
	 * @throws FileNotFoundException if 'webapps' directory cannot be found on CLASSPATH.
	 */
	protected String getWebAppsPath(String appName) throws FileNotFoundException {
		URL url = HdsWebServer.class.getProtectionDomain().getCodeSource().getLocation();
		String urlString = url.toString();
		return urlString.substring(0, urlString.lastIndexOf('/')) + "/webapps";
	}

	private static WebAppContext createWebAppContext(String name, final String appDir) {
		WebAppContext ctx = new WebAppContext();
		ctx.setDefaultsDescriptor(null);
		ServletHolder holder = new ServletHolder(new DefaultServlet());
		Map<String, String> params = ImmutableMap. <String, String> builder()
			.put("dirAllowed", "false")
			.build();
		holder.setInitParameters(params);
		ctx.setWelcomeFiles(new String[] {"index.html"});
		ctx.addServlet(holder, "/");
		ctx.setDisplayName(name);
		ctx.setContextPath("/");
		ctx.setWar(appDir + "/" + name);

		addNoCacheFilter(ctx);
		return ctx;
	}

	private static void addNoCacheFilter(WebAppContext ctxt) {
		defineFilter(ctxt, NO_CACHE_FILTER, NoCacheFilter.class.getName(),
				Collections.<String, String> emptyMap(), new String[] { "/*" });
	}

	/**
	 * Define a filter for a context and set up default url mappings.
	 */
	public static void defineFilter(Context ctx, String name,
			String classname, Map<String,String> parameters, String[] urls) {
		FilterHolder filterHolder = getFilterHolder(name, classname, parameters);
		FilterMapping fmap = getFilterMapping(name, urls);
		defineFilter(ctx, filterHolder, fmap);
	}

	private static FilterHolder getFilterHolder(String name, String classname,
			Map<String, String> parameters) {
		FilterHolder holder = new FilterHolder();
		holder.setName(name);
		holder.setClassName(classname);
		holder.setInitParameters(parameters);
		return holder;
	}

	private static FilterMapping getFilterMapping(String name, String[] urls) {
		FilterMapping fmap = new FilterMapping();
		fmap.setPathSpecs(urls);
		fmap.setDispatches(Handler.ALL);
		fmap.setFilterName(name);
		return fmap;
	}

	/**
	 * Define a filter for a context and set up default url mappings.
	 */
	private static void defineFilter(Context ctx, FilterHolder holder,
			FilterMapping fmap) {
		ServletHandler handler = ctx.getServletHandler();
		handler.addFilter(holder, fmap);
	}

	private void initializeWebServer(String name)
			throws IOException {

			Preconditions.checkNotNull(webAppContext);

			int maxThreads = 250;
			// If HTTP_MAX_THREADS is not configured, QueueThreadPool() will use the
			// default value (currently 250).
			QueuedThreadPool threadPool = new QueuedThreadPool(maxThreads);
			threadPool.setDaemon(true);
			webServer.setThreadPool(threadPool);
			webServer.setSendServerVersion(false);

			SessionManager sm = webAppContext.getSessionHandler().getSessionManager();
			if (sm instanceof AbstractSessionManager) {
				AbstractSessionManager asm = (AbstractSessionManager)sm;
				asm.setHttpOnly(true);
				asm.setSecureCookies(true);
			}

			ContextHandlerCollection contexts = new ContextHandlerCollection();
			webServer.setHandler(contexts);

			final String appDir = getWebAppsPath(name);

			webServer.addHandler(webAppContext);

			addDefaultApps(contexts, appDir);
	}

	/**
	 * Add default apps.
	 * @param appDir The application directory
	 * @throws IOException
	 */
	protected void addDefaultApps(ContextHandlerCollection parent,
			final String appDir) throws IOException {
		// set up the context for "/static/*"
		Context staticContext = new Context(parent, "/static");
		staticContext.setResourceBase(appDir + "/static");
		staticContext.addServlet(DefaultServlet.class, "/*");
		staticContext.setDisplayName("static");
		@SuppressWarnings("unchecked")
		Map<String, String> params = staticContext.getInitParams();
		params.put("org.mortbay.jetty.servlet.Default.dirAllowed", "false");
		// Modify: do we need a session handler?
		SessionHandler handler = new SessionHandler();
		SessionManager sm = handler.getSessionManager();
		if (sm instanceof AbstractSessionManager) {
			AbstractSessionManager asm = (AbstractSessionManager) sm;
			asm.setHttpOnly(true);
			asm.setSecureCookies(true);
		}
		staticContext.setSessionHandler(handler);
		defaultContexts.put(staticContext, true);
	}

	public static Connector createDefaultChannelConnector() {
		SelectChannelConnector ret = new SelectChannelConnectorWithSafeStartup();
		configureChannelConnector(ret);
		return ret;
	}

	private static void configureChannelConnector(SelectChannelConnector c) {
		c.setLowResourceMaxIdleTime(10000);
		c.setAcceptQueueSize(128);
		c.setResolveNames(false);
		c.setUseDirectBuffers(false);
		c.setHeaderBufferSize(1024*64);
	}

	private void addListener(Connector connector) {
		listeners.add(connector);
	}

	private void loadListeners() {
		for (Connector c : listeners) {
			webServer.addConnector(c);
		}
	}

	/**
	 * Start the server. Does not wait for the server to start.
	 */
	public void start() throws IOException {
		try {
			try {
				openListeners();
				webServer.start();
			} catch (IOException ex) {
				LOG.info("HttpServer.start() threw a non Bind IOException", ex);
				throw ex;
			} catch (MultiException ex) {
				LOG.info("HttpServer.start() threw a MultiException", ex);
				throw ex;
			}
			// Make sure there is no handler failures.
			Handler[] handlers = webServer.getHandlers();
			for (Handler handler : handlers) {
				if (handler.isFailed()) {
					throw new IOException(
							"Problem in starting http server. Server handlers failed");
				}
			}
			// Make sure there are no errors initializing the context.
			Throwable unavailableException = webAppContext.getUnavailableException();
			if (unavailableException != null) {
				// Have to stop the webserver, or else its non-daemon threads
				// will hang forever.
				webServer.stop();
				throw new IOException("Unable to initialize WebAppContext",
						unavailableException);
			}
		} catch (IOException e) {
			throw e;
		} catch (InterruptedException e) {
			throw (IOException) new InterruptedIOException(
					"Interrupted while starting HTTP server").initCause(e);
		} catch (Exception e) {
			throw new IOException("Problem starting http server", e);
		}
	}

	public void join() throws InterruptedException {
		webServer.join();
	}

	/**
	 * Open the main listener for the server
	 * @throws Exception
	 */
	void openListeners() throws Exception {
		for (Connector listener : listeners) {
			if (listener.getLocalPort() != -1) {
				// This listener is either started externally or has been bound
				continue;
			}
			int port = listener.getPort();
			bindForSinglePort(listener, port);
		}
	}

	/**
	 * Bind using single configured port. If findPort is true, we will try to bind
	 * after incrementing port till a free port is found.
	 * @param listener jetty listener.
	 * @param port port which is set in the listener.
	 * @throws Exception
	 */
	private void bindForSinglePort(Connector listener, int port)
			throws Exception {
			try {
				bindListener(listener);
			} catch (BindException ex) {
				throw constructBindException(listener, ex);
			}
	}

	/**
	 * Bind listener by closing and opening the listener.
	 * @param listener
	 * @throws Exception
	 */
	private static void bindListener(Connector listener) throws Exception {
		// jetty has a bug where you can't reopen a listener that previously
		// failed to open w/o issuing a close first, even if the port is changed
		listener.close();
		listener.open();
		LOG.info("Jetty bound to port " + listener.getLocalPort());
	}

	/**
	 * Create bind exception by wrapping the bind exception thrown.
	 * @param listener
	 * @param ex
	 * @return
	 */
	private static BindException constructBindException(Connector listener,
			BindException ex) {
		BindException be = new BindException("Port in use: "
				+ listener.getHost() + ":" + listener.getPort());
		if (ex != null) {
			be.initCause(ex);
		}
		return be;
	}

	/**
	 * stop the server
	 */
	public void stop() throws Exception {
		MultiException exception = null;
		for (Connector c : listeners) {
			try {
				c.close();
			} catch (Exception e) {
				LOG.error( "Error while stopping listener for webapp"
						+ webAppContext.getDisplayName(), e);
				exception = addMultiException(exception, e);
			}
		}

		try {
			// clear & stop webAppContext attributes to avoid memory leaks.
			webAppContext.clearAttributes();
			webAppContext.stop();
		} catch (Exception e) {
			LOG.error("Error while stopping web app context for webapp "
					+ webAppContext.getDisplayName(), e);
			exception = addMultiException(exception, e);
		}

		try {
			webServer.stop();
		} catch (Exception e) {
			LOG.error("Error while stopping web server for webapp "
					+ webAppContext.getDisplayName(), e);
			exception = addMultiException(exception, e);
		}

		if (exception != null) {
			exception.ifExceptionThrow();
		}
	}

	private MultiException addMultiException(MultiException exception, Exception e) {
		if(exception == null){
			exception = new MultiException();
		}
		exception.add(e);
		return exception;
	}

	public static void main(String[] args) {
		try {
			URI uri = URI.create("http://0.0.0.0:8080");
			HdsWebServer hws = new HdsWebServer("hds", uri);
			hws.start();
			hws.join();
			//Thread.sleep(5000);
			//LOG.info("Sleeping finished");
			//hws.stop();
		} catch (Exception e) {
			LOG.error("main: ", e);
		}
	}

	public static class LOG {
		public static void info(String msg) {
			System.out.println("LOG.info: " + msg);
		}

		public static void info(String msg, Exception ex) {
			System.out.println("LOG.info: " + msg);
			ex.printStackTrace();
		}

		public static void error(String msg, Exception ex) {
			System.out.println("LOG.error: " + msg);
			ex.printStackTrace();
		}

		public static void warn(String msg) {
			System.out.println("LOG.warn: " + msg);
		}
	}

	public static class NoCacheFilter implements Filter {
		@Override
		public void init(FilterConfig filterConfig) throws ServletException {
		}

		@Override
		public void doFilter(ServletRequest req, ServletResponse res,
				FilterChain chain)
			throws IOException, ServletException {
			HttpServletResponse httpRes = (HttpServletResponse) res;
			httpRes.setHeader("Cache-Control", "no-cache");
			long now = System.currentTimeMillis();
			httpRes.addDateHeader("Expires", now);
			httpRes.addDateHeader("Date", now);
			httpRes.addHeader("Pragma", "no-cache");
			chain.doFilter(req, res);
		}

		@Override
		public void destroy() {
		}
	}

	private static class SelectChannelConnectorWithSafeStartup
			extends SelectChannelConnector {
			public SelectChannelConnectorWithSafeStartup() {
				super();
			}

			/* Override the broken isRunning() method (JETTY-1316). This bug is present
			 * in 6.1.26. For the versions wihout this bug, it adds insignificant
			 * overhead.
			 */
			@Override
			public boolean isRunning() {
				if (super.isRunning()) {
					return true;
				}
				// We might be hitting JETTY-1316. If the internal state changed from
				// STARTING to STARTED in the middle of the check, the above call may
				// return false.  Check it one more time.
				LOG.warn("HttpServer Acceptor: isRunning is false. Rechecking.");
				try {
					Thread.sleep(10);
				} catch (InterruptedException ie) {
					// Mark this thread as interrupted. Someone up in the call chain
					// might care.
					Thread.currentThread().interrupt();
				}
				boolean runState = super.isRunning();
				LOG.warn("HttpServer Acceptor: isRunning is " + runState);
				return runState;
			}
	}
}
